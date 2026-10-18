<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditTrail;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /** Dapatkan Guzzle client dengan CA bundle lokal jika tersedia. */
    protected function getHttpClient(): GuzzleClient
    {
        $options = [];

        $caPaths = [
            'C:\\Program Files\\Git\\mingw64\\etc\\ssl\\certs\\ca-bundle.crt',
            'C:\\Program Files\\Git\\usr\\ssl\\certs\\ca-bundle.crt',
            'D:\\Xamp\\apache\\bin\\curl-ca-bundle.crt',
            'D:\\Xamp\\perl\\vendor\\lib\\Mozilla\\CA\\cacert.pem',
        ];

        foreach ($caPaths as $path) {
            if (file_exists($path)) {
                $options['verify'] = $path;
                break;
            }
        }

        return new GuzzleClient($options);
    }

    /**
     * Mengarahkan pengguna ke halaman OAuth Google.
     */
    public function redirect(Request $request): RedirectResponse|JsonResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');

        if (!config('services.google.client_id') || !config('services.google.client_secret')) {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'error',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (gagal)',
                httpStatus: 503,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_not_configured',
                    'error_description' => 'Konfigurasi Google OAuth belum lengkap di server (.env). Nilai GOOGLE_CLIENT_ID atau GOOGLE_CLIENT_SECRET kosong.',
                    'error_tip' => 'Lengkapi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET pada file backend/.env.',
                ]
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Konfigurasi Google OAuth belum lengkap di server (.env).',
                ], 503);
            }

            return redirect($frontendUrl . '/login?error=google_not_configured');
        }

        try {
            $driver = Socialite::driver('google');
            if ($driver instanceof \Laravel\Socialite\Two\AbstractProvider && !($driver instanceof \Mockery\MockInterface)) {
                $driver->setHttpClient($this->getHttpClient());
            }

            $redirectUrl = $driver
                ->scopes(['openid', 'profile', 'email'])
                ->redirect()
                ->getTargetUrl();

            if ($request->wantsJson() || $request->query('mode') === 'json') {
                return response()->json(['url' => $redirectUrl]);
            }

            return redirect()->away($redirectUrl);
        } catch (\Throwable $e) {
            Log::error('Gagal membuat URL OAuth Google: ' . $e->getMessage());

            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'error',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (gagal)',
                httpStatus: 500,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_failed',
                    'error_description' => 'Gagal membuat URL OAuth Google: ' . class_basename($e),
                    'error_type' => class_basename($e),
                    'error_source' => basename($e->getFile()) . ':' . $e->getLine(),
                ]
            );

            if ($request->wantsJson()) {
                return response()->json(['message' => 'Gagal menghubungkan ke Google.'], 500);
            }

            return redirect($frontendUrl . '/login?error=google_failed');
        }
    }

    /**
     * Menangani callback setelah otentikasi dari Google.
     */
    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');

        // Pengguna membatalkan login
        if ($request->has('error')) {
            Log::info('Google OAuth dibatalkan: ' . $request->query('error'));

            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'security',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (dibatalkan)',
                httpStatus: 302,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_cancelled',
                    'error_description' => 'Autentikasi Google dibatalkan oleh pengguna (' . ($request->query('error') ?? 'access_denied') . ').',
                ]
            );

            return redirect($frontendUrl . '/login?error=google_cancelled');
        }

        if (!$request->has('code')) {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'security',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (gagal)',
                httpStatus: 302,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_no_code',
                    'error_description' => 'Permintaan callback Google tidak menyertakan parameter authorization code.',
                ]
            );

            return redirect($frontendUrl . '/login?error=google_no_code');
        }

        try {
            $driver = Socialite::driver('google');
            if ($driver instanceof \Laravel\Socialite\Two\AbstractProvider && !($driver instanceof \Mockery\MockInterface)) {
                $driver->setHttpClient($this->getHttpClient());
            }

            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = $driver->user();
        } catch (\Throwable $e) {
            Log::error('Gagal mengambil data pengguna dari Google: ' . $e->getMessage());

            $rawMsg = $e->getMessage();
            $desc = 'Gagal mengambil data pengguna dari Google: ' . class_basename($e);
            $tip = null;
            if (str_contains($rawMsg, 'invalid_client') || str_contains($rawMsg, 'client secret is invalid')) {
                $desc = 'Kredensial GOOGLE_CLIENT_SECRET di backend .env tidak valid atau ditolak oleh Google (401 invalid_client).';
                $tip = 'Periksa nilai GOOGLE_CLIENT_SECRET pada backend/.env dan pastikan sesuai dengan Google Cloud Console.';
            } elseif (str_contains($rawMsg, 'redirect_uri_mismatch')) {
                $desc = 'URL callback redirect tidak cocok dengan yang terdaftar di Google Cloud Console.';
                $tip = 'Tambahkan ' . url('/api/auth/google/callback') . ' pada Authorized redirect URIs di Google Cloud Console.';
            } elseif (str_contains($rawMsg, 'cURL error 60')) {
                $desc = 'Gagal verifikasi sertifikat SSL cURL saat menghubungi server Google.';
                $tip = 'Periksa konfigurasi curl.cainfo di php.ini.';
            }

            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'error',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (gagal)',
                httpStatus: 302,
                context: array_filter([
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_failed',
                    'error_description' => $desc,
                    'error_type' => class_basename($e),
                    'error_source' => basename($e->getFile()) . ':' . $e->getLine(),
                    'error_tip' => $tip,
                ])
            );

            return redirect($frontendUrl . '/login?error=google_failed');
        }

        $email = $googleUser->getEmail();
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'security',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (gagal)',
                httpStatus: 302,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_no_email',
                    'error_description' => 'Akun Google yang digunakan tidak menyediakan alamat email yang valid.',
                ]
            );

            return redirect($frontendUrl . '/login?error=google_no_email');
        }

        $rawUser = $googleUser->getRaw();
        if (($rawUser['email_verified'] ?? $rawUser['verified_email'] ?? false) !== true) {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'security',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (email belum diverifikasi)',
                httpStatus: 302,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_unverified_email',
                    'error_description' => 'Alamat email akun Google belum diverifikasi oleh Google.',
                ]
            );

            return redirect($frontendUrl . '/login?error=google_unverified_email');
        }

        $googleId = (string) $googleUser->getId();
        if ($googleId === '') {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'security',
                result: 'failed',
                summary: 'Masuk (Google) · Akun (gagal)',
                httpStatus: 302,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'error_code' => 'google_failed',
                    'error_description' => 'Gagal mendapatkan ID unik pengguna dari Google.',
                ]
            );

            return redirect($frontendUrl . '/login?error=google_failed');
        }
        $googleName = $googleUser->getName() ?: explode('@', $email)[0];

        // 1. Cari berdasarkan google_id
        $user = User::where('google_id', $googleId)->first();
        $isNewUser = false;

        // Jangan tautkan akun lokal hanya berdasarkan email dari provider.
        if (!$user) {
            if (User::where('email', $email)->exists()) {
                app(AuditTrail::class)->recordCustom(
                    request: $request,
                    module: 'auth',
                    action: 'auth.login',
                    kind: 'security',
                    result: 'failed',
                    summary: 'Masuk (Google) · Akun (konflik akun)',
                    httpStatus: 302,
                    context: [
                        'auth_method' => 'google',
                        'auth_label' => 'Google OAuth 2.0',
                        'error_code' => 'google_account_exists',
                        'error_description' => 'Alamat email ini sudah terdaftar sebelumnya dengan kata sandi manual. Login otomatis dicegah demi keamanan akun.',
                        'error_tip' => 'Pengguna dapat masuk menggunakan email & kata sandi manual.',
                    ]
                );

                return redirect($frontendUrl . '/login?error=google_account_exists');
            }

            // Buat akun pengguna baru dari Google.
            $user = User::create([
                'google_id' => $googleId,
                'name' => $googleName,
                'email' => $email,
                'email_verified_at' => now(),
                'foto_profil' => $googleUser->getAvatar(),
                'password' => bcrypt(Str::random(32)),
                'role' => 'user',
            ]);
            $isNewUser = true;
        } else {
            $dirty = false;
            if ($googleName && $user->name !== $googleName) {
                $user->name = $googleName;
                $dirty = true;
            }
            if ($googleUser->getAvatar() && $user->foto_profil !== $googleUser->getAvatar()) {
                $user->foto_profil = $googleUser->getAvatar();
                $dirty = true;
            }
            if ($dirty) {
                $user->save();
            }
        }

        // Login ke session web Sanctum
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        // Catat ke log sistem (Audit Trail)
        if ($isNewUser) {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.register',
                kind: 'activity',
                result: 'success',
                summary: 'Daftar (Google) · Akun',
                httpStatus: 302,
                actor: $user,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'auth_description' => 'Akun baru berhasil didaftarkan secara otomatis melalui Akun Google.',
                    'email' => $email,
                ]
            );
        } else {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.login',
                kind: 'security',
                result: 'success',
                summary: 'Masuk (Google) · Akun',
                httpStatus: 302,
                actor: $user,
                context: [
                    'auth_method' => 'google',
                    'auth_label' => 'Google OAuth 2.0',
                    'auth_description' => 'Pengguna berhasil masuk menggunakan Akun Google.',
                    'email' => $user->email,
                ]
            );
        }

        // Arahkan kembali ke frontend
        return redirect($frontendUrl . '/auth/callback?status=success');
    }
}
