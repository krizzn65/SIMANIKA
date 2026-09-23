<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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
            return redirect($frontendUrl . '/login?error=google_cancelled');
        }

        if (!$request->has('code')) {
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
            return redirect($frontendUrl . '/login?error=google_failed');
        }

        $email = $googleUser->getEmail();
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return redirect($frontendUrl . '/login?error=google_no_email');
        }

        $rawUser = $googleUser->getRaw();
        if (($rawUser['email_verified'] ?? $rawUser['verified_email'] ?? false) !== true) {
            return redirect($frontendUrl . '/login?error=google_unverified_email');
        }

        $googleId = (string) $googleUser->getId();
        if ($googleId === '') {
            return redirect($frontendUrl . '/login?error=google_failed');
        }
        $googleName = $googleUser->getName() ?: explode('@', $email)[0];

        // 1. Cari berdasarkan google_id
        $user = User::where('google_id', $googleId)->first();

        // Jangan tautkan akun lokal hanya berdasarkan email dari provider.
        if (!$user) {
            if (User::where('email', $email)->exists()) {
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

        // Arahkan kembali ke frontend
        return redirect($frontendUrl . '/auth/callback?status=success');
    }
}
