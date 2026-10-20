<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $resetUrl = function ($user, string $token): string {
            $base = rtrim(config('app.frontend_url'), '/');
            return $base.'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()]);
        };
        ResetPassword::createUrlUsing($resetUrl);

        VerifyEmail::toMailUsing(fn ($user, string $url) => (new MailMessage)
            ->subject('Verifikasi email akun SIMANIKA')
            ->action('Verifikasi email', $url)
            ->view(['html' => 'emails.auth-action', 'text' => 'emails.auth-action-text'], [
                'eyebrow' => 'VERIFIKASI EMAIL',
                'title' => 'Satu langkah lagi.',
                'recipientName' => $user->name,
                'body' => 'Terima kasih sudah mendaftar di SIMANIKA. Konfirmasi alamat emailmu untuk mulai menggunakan akun.',
                'actionLabel' => 'Verifikasi email',
                'actionUrl' => $url,
                'expiresMinutes' => config('auth.verification.expire', 60),
                'securityNote' => 'Jika kamu tidak membuat akun SIMANIKA, abaikan email ini.',
            ]));

        ResetPassword::toMailUsing(function ($user, string $token) use ($resetUrl): MailMessage {
            $url = $resetUrl($user, $token);
            $broker = config('auth.defaults.passwords');

            return (new MailMessage)
                ->subject('Atur ulang kata sandi SIMANIKA')
                ->action('Atur ulang kata sandi', $url)
                ->view(['html' => 'emails.auth-action', 'text' => 'emails.auth-action-text'], [
                    'eyebrow' => 'PEMULIHAN AKUN',
                    'title' => 'Atur ulang kata sandimu.',
                    'recipientName' => $user->name,
                    'body' => 'Kami menerima permintaan untuk mengatur ulang kata sandi akun SIMANIKA milikmu. Gunakan tombol di bawah untuk membuat kata sandi baru.',
                    'actionLabel' => 'Atur ulang kata sandi',
                    'actionUrl' => $url,
                    'expiresMinutes' => config("auth.passwords.{$broker}.expire", 60),
                    'securityNote' => 'Jika kamu tidak meminta pengaturan ulang kata sandi, abaikan email ini. Kata sandimu tetap aman.',
                ]);
        });

        // Every API route: generous enough for a campus network sharing one IP,
        // but stops scripted flooding. Signed-in users are counted per account.
        RateLimiter::for('api', fn ($request) => $request->user()
            ? Limit::perMinute(300)->by('api-user:'.$request->user()->getAuthIdentifier())
            : Limit::perMinute(300)->by('api-ip:'.($request->ip() ?? 'unknown')));

        RateLimiter::for('auth', fn ($request) => [
            Limit::perMinute(60)->by('ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(10)->by(hash('sha256', ($request->ip() ?? 'unknown').'|'.strtolower((string) $request->input('email', '')))),
            // Password guessing from many IPs against one account.
            Limit::perHour(30)->by('auth-email:'.self::emailKey($request)),
        ]);
        RateLimiter::for('password', fn ($request) => [
            Limit::perMinute(20)->by('ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(5)->by(hash('sha256', ($request->ip() ?? 'unknown').'|'.strtolower((string) $request->input('email', '')))),
            // Reset-email bombing of one inbox from many IPs.
            Limit::perHour(10)->by('password-email:'.self::emailKey($request)),
        ]);
        RateLimiter::for('oauth', fn ($request) => Limit::perMinute(20)->by('ip:'.($request->ip() ?? 'unknown')));
        // OPREC requests can share the Next proxy's IP. Limit the authenticated
        // account, not a form email or the common proxy address.
        RateLimiter::for('oprec-submission', fn ($request) => Limit::perMinute(10)
            ->by('oprec-user:'.($request->user()?->getAuthIdentifier() ?? $request->ip() ?? 'unknown')));
        RateLimiter::for('oprec-announcement', fn ($request) => [
            Limit::perMinute(600)->by('announcement-ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(5)->by('announcement-nim:'.self::oprecRateKey($request, 'nim')),
        ]);
        RateLimiter::for('oprec-result-view', fn ($request) => [
            Limit::perMinute(1200)->by('result-view-ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(30)->by('result-ticket:'.self::oprecRateKey($request, 'ticket')),
        ]);
        RateLimiter::for('oprec-result', fn ($request) => [
            Limit::perMinute(20)->by('ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(5)->by(self::oprecRateKey($request, 'nim')),
        ]);
    }

    private static function emailKey($request): string
    {
        $email = $request->input('email', '');
        return hash('sha256', strtolower(trim(is_string($email) ? $email : '')));
    }

    private static function oprecRateKey($request, string $field): string
    {
        $value = $request->input($field, '');
        $value = is_string($value) ? $value : '';
        if ($field === 'nim') $value = strtoupper(trim($value));
        $period = $request->route('oprec');
        $id = $period instanceof \App\Models\Oprec ? $period->getKey() : (is_scalar($period) ? (string) $period : '');
        return hash('sha256', $id.'|'.$value);
    }
}
