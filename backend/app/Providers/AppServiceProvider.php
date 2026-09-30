<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        ResetPassword::createUrlUsing(function ($user, string $token): string {
            $base = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/');
            return $base.'/reset-password?'.http_build_query(['token' => $token, 'email' => $user->getEmailForPasswordReset()]);
        });

        RateLimiter::for('auth', fn ($request) => [
            Limit::perMinute(60)->by('ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(10)->by(hash('sha256', ($request->ip() ?? 'unknown').'|'.strtolower((string) $request->input('email', '')))),
        ]);
        RateLimiter::for('password', fn ($request) => [
            Limit::perMinute(20)->by('ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(5)->by(hash('sha256', ($request->ip() ?? 'unknown').'|'.strtolower((string) $request->input('email', '')))),
        ]);
        RateLimiter::for('oauth', fn ($request) => Limit::perMinute(20)->by('ip:'.($request->ip() ?? 'unknown')));
        RateLimiter::for('oprec-announcement', fn ($request) => [
            Limit::perMinute(600)->by('announcement-ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(5)->by('announcement-nim:'.hash('sha256', (string) $request->route('oprec').'|'.strtoupper(trim((string) $request->input('nim', ''))))),
        ]);
        RateLimiter::for('oprec-result-view', fn ($request) => [
            Limit::perMinute(1200)->by('result-view-ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(30)->by('result-ticket:'.hash('sha256', (string) $request->input('ticket', ''))),
        ]);
        RateLimiter::for('oprec-result', fn ($request) => [
            Limit::perMinute(20)->by('ip:'.($request->ip() ?? 'unknown')),
            Limit::perMinute(5)->by(hash('sha256', (string) $request->route('oprec').'|'.strtoupper(trim((string) $request->input('nim', ''))))),
        ]);
    }
}
