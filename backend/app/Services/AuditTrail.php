<?php

namespace App\Services;

use App\Models\AuditEntry;
use App\Models\Oprec;
use App\Models\User;
use Illuminate\Http\Request;
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
        if ($status < 500 && !in_array($status, [401, 403], true) && !in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true) && !$download) return;
        if (str_starts_with($route, 'api/admin/logs') && $status < 400) return;

        $module = $this->module($route);
        $action = $this->action($route, $method, $module, $download);
        $kind = $status >= 500 ? 'error' : (in_array($status, [401, 403], true) || $module === 'auth' || str_contains($route, '/verify') ? 'security' : 'activity');
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
        if ($status >= 500) {
            $context['error_type'] = $error ? class_basename($error) : 'HTTP_'.$status;
            $context['fingerprint'] = substr(hash('sha256', $context['error_type'].'|'.$route), 0, 12);
        }
        [$targetType, $targetId] = $this->target($request);
        $actor = $request->user();
        try {
            AuditEntry::create([
                'kind' => $kind,
                'module' => $module,
                'action' => $action,
                'result' => $result,
                'summary' => $this->summary($module, $action, $result),
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

    private function summary(string $module, string $action, string $result): string
    {
        $labels = ['auth' => 'Akun', 'oprec' => 'OPREC', 'events' => 'Event', 'users' => 'Pengguna',
            'merchandise' => 'Merchandise', 'settings' => 'Pengaturan', 'public' => 'Publik', 'system' => 'Sistem'];
        $verbs = ['login' => 'Masuk', 'logout' => 'Keluar', 'register' => 'Daftar', 'download' => 'Unduh berkas',
            'file_restore' => 'Pulihkan berkas', 'announcement_save' => 'Simpan pengumuman',
            'decision' => 'Tetapkan keputusan', 'review' => 'Ubah penilaian',
            'create' => 'Tambah data', 'update' => 'Ubah data', 'delete' => 'Hapus data',
            'access' => 'Akses', 'forgot_password' => 'Minta pemulihan sandi', 'reset_password' => 'Atur ulang sandi',
            'change_password' => 'Ganti sandi', 'written_test_create' => 'Buat tes tulis', 'written_test_update' => 'Ubah tes tulis'];
        $verb = $verbs[substr($action, strpos($action, '.') + 1)] ?? 'Aktivitas';
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
