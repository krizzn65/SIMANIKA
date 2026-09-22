<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_redirect_warns_when_not_configured(): void
    {
        config(['services.google.client_id' => null]);
        config(['services.google.client_secret' => null]);

        $response = $this->get('/api/auth/google/redirect');

        $response->assertRedirect('http://localhost:3000/login?error=google_not_configured');
    }

    public function test_google_redirect_returns_url_when_configured(): void
    {
        config(['services.google.client_id' => 'dummy-client-id']);
        config(['services.google.client_secret' => 'dummy-client-secret']);

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('scopes')->andReturnSelf();
        $provider->shouldReceive('redirect')->andReturn(new \Illuminate\Http\RedirectResponse('https://accounts.google.com/o/oauth2/v2/auth?dummy=1'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/redirect');

        $response->assertRedirect('https://accounts.google.com/o/oauth2/v2/auth?dummy=1');
    }

    public function test_google_callback_creates_new_user_and_logs_in(): void
    {
        config(['services.google.client_id' => 'dummy-client-id']);
        config(['services.google.client_secret' => 'dummy-client-secret']);

        $abstractUser = Mockery::mock(SocialiteUser::class);
        $abstractUser->shouldReceive('getId')->andReturn('google-123456');
        $abstractUser->shouldReceive('getName')->andReturn('Budi Santoso');
        $abstractUser->shouldReceive('getEmail')->andReturn('budi@gmail.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/callback?code=fake-code');

        $response->assertRedirect('http://localhost:3000/auth/callback?status=success');

        $this->assertDatabaseHas('users', [
            'email' => 'budi@gmail.com',
            'google_id' => 'google-123456',
            'name' => 'Budi Santoso',
        ]);

        $this->assertAuthenticated('web');
    }

    public function test_google_callback_links_existing_email_user(): void
    {
        config(['services.google.client_id' => 'dummy-client-id']);
        config(['services.google.client_secret' => 'dummy-client-secret']);

        $existingUser = User::create([
            'name' => 'Siti Aminah',
            'email' => 'siti@gmail.com',
            'password' => bcrypt('password123'),
            'role' => 'user',
        ]);

        $abstractUser = Mockery::mock(SocialiteUser::class);
        $abstractUser->shouldReceive('getId')->andReturn('google-987654');
        $abstractUser->shouldReceive('getName')->andReturn('Siti Aminah');
        $abstractUser->shouldReceive('getEmail')->andReturn('siti@gmail.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/siti.jpg');

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('stateless')->andReturnSelf();
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/callback?code=fake-code');

        $response->assertRedirect('http://localhost:3000/auth/callback?status=success');

        $this->assertDatabaseHas('users', [
            'id' => $existingUser->id,
            'email' => 'siti@gmail.com',
            'google_id' => 'google-987654',
        ]);

        $this->assertAuthenticated('web');
    }

    public function test_google_callback_handles_user_cancellation(): void
    {
        $response = $this->get('/api/auth/google/callback?error=access_denied');

        $response->assertRedirect('http://localhost:3000/login?error=google_cancelled');
        $this->assertGuest('web');
    }
}
