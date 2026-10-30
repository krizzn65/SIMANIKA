<?php

namespace App\Services;

use App\Models\AuditEntry;
use App\Models\Oprec;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AuditTrail
{
    private const SAFE_FIELDS = [
        'role', 'status', 'name', 'headline', 'periode', 'tanggal_buka', 'tanggal_tutup',
        'published', 'pengumuman', 'form_fields', 'questions', 'divisi_tersedia',
        'file', 'poster', 'accepted_division_id', 'accepted_position',
    ];

    public function captureBefore(Request $request): array
    {
        if (!$request->user()) return [];
        $route = $request->route()?->uri();
        if ($request->isMethod('PUT') && $route === 'api/admin/users/{id}') {
            $role = User::whereKey($request->route('id'))->value('role');
            return $role === null ? [] : ['role' => $role];
        }
        if ($request->isMethod('PUT') && $route === 'api/admin/oprec/{oprec}') {
            $id = $this->parameterId($request->route('oprec'));
            $status = Oprec::whereKey($id)->value('status');
            return $status === null ? [] : ['status' => $status];
        }
        return [];
    }

    public function record(Request $request, int $status, string $requestId, array $before = [], ?\Throwable $error = null): void
    {
        $route = $request->route()?->uri() ?? $request->path();
        $method = $request->method();
        $download = $method === 'GET' && (str_contains($route, '/files/') || str_contains($route, '/export/'));
        if ($status < 500 && !in_array($status, [401, 403, 429], true) && !in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && !$download) return;
        if (str_starts_with($route, 'api/admin/logs') && $status < 400) return;
        // The reports themselves are logged by ClientErrorController; skip the duplicate.
        if ($route === 'api/public/client-errors' && $status < 400) return;
        // Every page load by a signed-out visitor asks who is logged in; that 401 is expected, not a failed access.
        if ($method === 'GET' && $route === 'api/auth/me' && $status === 401) return;
        // A flood produces thousands of 429s; one row per IP per minute is enough evidence.
        if ($status === 429 && !Cache::add('audit-429:'.($request->ip() ?? 'unknown'), true, 60)) return;

        $module = $this->module($route);
        $action = $this->action($route, $method, $module, $download);
        $kind = $status >= 500 ? 'error' : (in_array($status, [401, 403, 429], true) || $module === 'auth' || str_contains($route, '/verify') ? 'security' : 'activity');
        $result = $status >= 400 ? 'failed' : 'success';
        $context = [];
        if (!in_array($module, ['auth', 'public'], true)) {
            $fields = array_values(array_intersect(array_keys($request->all()), self::SAFE_FIELDS));
            if ($fields) $context['fields'] = $fields;
        }
        if ($before) {
            $context['before'] = $before;
            if ($status < 400 && ($after = $this->captureBefore($request))) $context['after'] = $after;
        }

        // Rincian khusus modul autentikasi (manual vs OAuth)
        if ($module === 'auth') {
            if ($action === 'auth.login') {
                $context['auth_method'] = 'manual';
                $context['auth_label'] = 'Manual (Email & Kata Sandi)';
                if ($result === 'success') {
                    $context['auth_description'] = 'Pengguna berhasil masuk menggunakan email dan kata sandi.';
                    if ($request->has('remember')) {
                        $context['remember_me'] = $request->boolean('remember');
                    }
                } else {
                    $context['error_description'] = 'Kombinasi email atau kata sandi tidak sesuai.';
                    $context['error_type'] = $error ? class_basename($error) : 'ValidationException';
                }
            } elseif ($action === 'auth.register') {
                $context['auth_method'] = 'manual';
                $context['auth_label'] = 'Manual (Form Pendaftaran)';
                if ($result === 'success') {
                    $context['auth_description'] = 'Pendaftaran akun baru berhasil melalui form registrasi.';
                } else {
                    $context['error_description'] = 'Pendaftaran akun gagal: data formulir tidak memenuhi ketentuan.';
                    $context['error_type'] = $error ? class_basename($error) : 'ValidationException';
                }
            } elseif ($action === 'auth.logout') {
                $context['auth_description'] = 'Pengguna keluar dari sesi akun.';
            }
        }

        if ($status === 429) {
            $context['error_type'] = 'HTTP_429';
            $context['error_description'] = 'Permintaan dari IP ini melewati batas dan ditolak. Dicatat sekali per menit per IP.';
        }

        // Rincian error untuk seluruh modul sistem
        if ($status >= 500) {
            $context['error_type'] = $error ? class_basename($error) : 'HTTP_'.$status;
            $context['fingerprint'] = substr(hash('sha256', $context['error_type'].'|'.$route), 0, 12);
            $context['error_description'] = $this->humanErrorDescription($status, $error);
            if ($error) {
                $context['error_source'] = basename($error->getFile()) . ':' . $error->getLine();
            }
        } elseif ($status >= 400) {
            if (!isset($context['error_type'])) {
                $context['error_type'] = $error ? class_basename($error) : 'HTTP_'.$status;
            }
            if (!isset($context['error_description'])) {
                $context['error_description'] = $this->humanErrorDescription($status, $error);
            }
            if ($error instanceof \Illuminate\Validation\ValidationException && !isset($context['validation_errors'])) {
                $valErrors = [];
                foreach ($error->errors() as $field => $messages) {
                    if (!in_array($field, ['password', 'password_confirmation', 'current_password'], true)) {
                        $valErrors[$field] = $messages;
                    } else {
                        $valErrors[$field] = ['Kata sandi tidak memenuhi kriteria keamanan.'];
                    }
                }
                if (!empty($valErrors)) {
                    $context['validation_errors'] = $valErrors;
                }
            }
            if ($error && !isset($context['error_source'])) {
                $context['error_source'] = basename($error->getFile()) . ':' . $error->getLine();
            }
        }

        [$targetType, $targetId] = $this->target($request);
        $actor = $request->user();
        try {
            AuditEntry::create([
                'kind' => $kind,
                'module' => $module,
                'action' => $action,
                'result' => $result,
                'summary' => $this->summary($module, $action, $result, $context),
                'actor_id' => $actor?->id,
                'actor_name' => $actor?->name,
                'actor_role' => $actor?->effectiveRole(),
                'target_type' => $targetType,
                'target_id' => $targetId,
                'ip_address' => $request->ip(),
                'request_id' => $requestId,
                'method' => $method,
                'route' => mb_substr($route, 0, 200),
                'http_status' => $status,
                'context' => $context ?: null,
            ]);
        } catch (\Throwable $writeError) {
            Log::warning('Audit entry could not be stored', ['error_type' => class_basename($writeError)]);
        }
    }

    public function recordCustom(
        Request $request,
        string $module,
        string $action,
        string $kind,
        string $result,
        string $summary,
        int $httpStatus,
        ?string $requestId = null,
        ?User $actor = null,
        array $context = []
    ): void {
        $requestId = $requestId ?? (string) \Illuminate\Support\Str::uuid();
        $actor = $actor ?? $request->user();
        $route = $request->route()?->uri() ?? $request->path();
        try {
            AuditEntry::create([
                'kind' => $kind,
                'module' => $module,
                'action' => $action,
                'result' => $result,
                'summary' => $summary,
                'actor_id' => $actor?->id,
                'actor_name' => $actor?->name,
                'actor_role' => $actor?->effectiveRole(),
                'target_type' => null,
                'target_id' => null,
                'ip_address' => $request->ip(),
                'request_id' => $requestId,
                'method' => $request->method(),
                'route' => mb_substr($route, 0, 200),
                'http_status' => $httpStatus,
                'context' => $context ?: null,
            ]);
        } catch (\Throwable $writeError) {
            Log::warning('Audit entry could not be stored', ['error_type' => class_basename($writeError)]);
        }
    }

    private function humanErrorDescription(int $status, ?\Throwable $error = null): string
    {
        if ($error instanceof \Illuminate\Validation\ValidationException) {
            return 'Validasi formulir tidak lolos. Periksa rincian kolom yang bermasalah.';
        }
        if ($error instanceof \Illuminate\Auth\AuthenticationException || $status === 401) {
            return 'Autentikasi gagal: Sesi telah berakhir atau kredensial akses tidak valid.';
        }
        if ($error instanceof \Illuminate\Auth\Access\AuthorizationException || $status === 403) {
            return 'Akses ditolak: Pengguna tidak memiliki kewenangan / role untuk melakukan aksi ini.';
        }
        if ($status === 404) {
            return 'Data atau endpoint yang dituju tidak ditemukan.';
        }
        if ($status === 429) {
            return 'Batas pengiriman permintaan (rate limit) terlampaui. Coba lagi dalam beberapa saat.';
        }
        if ($status >= 500) {
            $base = $error ? class_basename($error) : 'InternalServerError';
            return match ($base) {
                'QueryException' => 'Kesalahan pada eksekusi basis data SQL.',
                'ModelNotFoundException' => 'Data entitas yang dicari tidak ditemukan dalam basis data.',
                'FileNotFoundException' => 'Berkas yang diminta tidak ditemukan pada penyimpanan.',
                'HttpException' => 'Layanan server mengalami kendala internal.',
                default => 'Terjadi kendala internal server saat memproses permintaan.',
            };
        }
        return 'Permintaan gagal diproses (HTTP ' . $status . ').';
    }

    private function module(string $route): string
    {
        if (str_contains($route, '/auth/') || str_ends_with($route, '/login')) return 'auth';
        if (str_contains($route, '/oprec')) return 'oprec';
        if (str_contains($route, '/events') || str_contains($route, '/teams')) return 'events';
        if (str_contains($route, '/users')) return 'users';
        if (str_contains($route, '/merchandise')) return 'merchandise';
        if (str_contains($route, '/settings') || str_contains($route, '/content')) return 'settings';
        if (str_contains($route, '/public/')) return 'public';
        return 'system';
    }

    private function action(string $route, string $method, string $module, bool $download): string
    {
        if ($download) return $module.'.download';
        if ($module === 'auth') {
            foreach (['login', 'logout', 'register', 'forgot-password', 'reset-password', 'change-password'] as $name) {
                if (str_ends_with($route, '/'.$name)) return 'auth.'.str_replace('-', '_', $name);
            }
        }
        if (str_contains($route, '/files/') && $method === 'POST') return $module.'.file_restore';
        if (str_contains($route, '/announcement') && $method !== 'GET') return $module.'.announcement_save';
        if (str_contains($route, '/assessment/registrations/') && $method === 'PUT') return 'oprec.decision';
        if (str_contains($route, '/assessment/registrations/') && $method === 'PATCH') return 'oprec.review';
        if (str_contains($route, '/written-test') && $method !== 'GET') return $module.'.written_test_'.($method === 'POST' ? 'create' : 'update');
        $verb = match ($method) {
            'POST' => 'create', 'PUT', 'PATCH' => 'update', 'DELETE' => 'delete', default => 'access',
        };
        return $module.'.'.$verb;
    }

    private function summary(string $module, string $action, string $result, array $context = []): string
    {
        $labels = ['auth' => 'Akun', 'oprec' => 'OPREC', 'events' => 'Event', 'users' => 'Pengguna',
            'merchandise' => 'Merchandise', 'settings' => 'Pengaturan', 'public' => 'Publik', 'system' => 'Sistem'];
        $verbs = ['login' => 'Masuk', 'logout' => 'Keluar', 'register' => 'Daftar', 'download' => 'Unduh berkas',
            'file_restore' => 'Pulihkan berkas', 'announcement_save' => 'Simpan pengumuman',
            'decision' => 'Tetapkan keputusan', 'review' => 'Ubah penilaian',
            'create' => 'Tambah data', 'update' => 'Ubah data', 'delete' => 'Hapus data',
            'access' => 'Akses', 'forgot_password' => 'Minta pemulihan sandi', 'reset_password' => 'Atur ulang sandi',
            'change_password' => 'Ganti sandi', 'written_test_create' => 'Buat tes tulis', 'written_test_update' => 'Ubah tes tulis'];
        $actionName = substr($action, strpos($action, '.') + 1);
        $verb = $verbs[$actionName] ?? 'Aktivitas';
        if ($module === 'auth' && in_array($actionName, ['login', 'register'], true)) {
            $methodTag = ($context['auth_method'] ?? 'manual') === 'google' ? ' (Google)' : ' (Manual)';
            $verb .= $methodTag;
        }
        return $verb.' · '.($labels[$module] ?? 'Sistem').($result === 'failed' ? ' (gagal)' : '');
    }

    private function target(Request $request): array
    {
        foreach (['registration', 'submission', 'id', 'oprec', 'event', 'group', 'member'] as $key) {
            $value = $request->route()?->parameter($key);
            if ($value !== null) return [$key, mb_substr((string) $this->parameterId($value), 0, 80)];
        }
        return [null, null];
    }

    private function parameterId(mixed $value): int|string
    {
        return is_object($value) && method_exists($value, 'getKey') ? $value->getKey() : (string) $value;
    }
}
