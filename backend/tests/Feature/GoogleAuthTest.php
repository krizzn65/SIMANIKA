<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
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
        $provider->shouldReceive('scopes')->andReturnSelf();
        $provider->shouldReceive('redirect')->andReturn(new \Illuminate\Http\RedirectResponse('https://accounts.google.com/o/oauth2/v2/auth?dummy=1'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/redirect');

        $response->assertRedirect('https://accounts.google.com/o/oauth2/v2/auth?dummy=1');
    }

    public function test_google_redirect_issues_session_bound_state(): void
    {
        config(['services.google.client_id' => 'dummy-client-id', 'services.google.client_secret' => 'dummy-client-secret']);
        $response = $this->get('/api/auth/google/redirect');
        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        $this->assertNotEmpty($query['state'] ?? null);
        $this->assertSame($query['state'], session('state'));
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
        $abstractUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/callback?code=fake-code');

        $response->assertRedirect('http://localhost:3000/auth/callback?status=success');

        $this->assertDatabaseHas('users', [
            'email' => 'budi@gmail.com',
            'google_id' => 'google-123456',
            'name' => 'Budi Santoso',
        ]);

        $this->assertNotNull(User::where('email', 'budi@gmail.com')->firstOrFail()->email_verified_at);

        $this->assertAuthenticated('web');
    }

    public function test_google_callback_links_existing_gmail_account_without_losing_manual_login(): void
    {
        config(['services.google.client_id' => 'dummy-client-id']);
        config(['services.google.client_secret' => 'dummy-client-secret']);

        $existingUser = User::create([
            'name' => 'Nama Manual',
            'email' => 'SITI@gmail.com',
            'password' => bcrypt('password123'),
            'role' => 'user',
        ]);

        $abstractUser = Mockery::mock(SocialiteUser::class);
        $abstractUser->shouldReceive('getId')->andReturn('google-987654');
        $abstractUser->shouldReceive('getName')->andReturn('Siti Aminah');
        $abstractUser->shouldReceive('getEmail')->andReturn('siti@gmail.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/siti.jpg');
        $abstractUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/api/auth/google/callback?code=fake-code');

        $response->assertRedirect('http://localhost:3000/auth/callback?status=success');

        $this->assertDatabaseHas('users', [
            'id' => $existingUser->id,
            'email' => 'SITI@gmail.com',
            'google_id' => 'google-987654',
            'name' => 'Nama Manual',
        ]);
        $this->assertSame(1, User::count());
        $this->assertNotNull($existingUser->fresh()->email_verified_at);
        $this->assertAuthenticatedAs($existingUser, 'web');
        $this->post('/api/auth/logout')->assertOk();
        $this->postJson('/api/auth/login', ['email' => 'SITI@gmail.com', 'password' => 'password123'])
            ->assertOk()->assertJsonPath('data.id', $existingUser->id);
        $this->post('/api/auth/logout')->assertOk();
        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/auth/callback?status=success');
        $this->assertAuthenticatedAs($existingUser, 'web');
        $this->assertSame('Nama Manual', $existingUser->fresh()->name);
    }

    public function test_non_google_hosted_email_links_only_after_matching_password_login(): void
    {
        $existing = User::create([
            'name' => 'Akun Manual', 'email' => 'student@example.test',
            'password' => bcrypt('password123'), 'role' => 'user',
        ]);
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-external');
        $googleUser->shouldReceive('getName')->andReturn('Nama dari Google');
        $googleUser->shouldReceive('getEmail')->andReturn('student@example.test');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/login?error=google_link_password_required');
        $this->assertNotNull(session('pending_google_link'));
        $this->assertDatabaseHas('users', ['id' => $existing->id, 'google_id' => null]);
        $this->assertGuest('web');

        $this->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/login', 'X-Requested-With' => 'XMLHttpRequest']);
        $this->postJson('/api/auth/login', ['email' => 'student@example.test', 'password' => 'wrong'])
            ->assertUnprocessable();
        $this->assertNotNull(session('pending_google_link'));
        $this->assertDatabaseHas('users', ['id' => $existing->id, 'google_id' => null]);
        $this->postJson('/api/auth/login', ['email' => 'student@example.test', 'password' => 'password123'])
            ->assertOk()->assertJsonPath('googleLinkedNow', true)->assertJsonPath('data.id', $existing->id);
        $this->assertDatabaseHas('users', ['id' => $existing->id, 'google_id' => 'google-external']);
        $this->assertNull($existing->fresh()->email_verified_at);

        $this->post('/api/auth/logout')->assertOk();
        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/auth/callback?status=success');
        $this->assertAuthenticatedAs($existing, 'web');
        $this->assertNull($existing->fresh()->email_verified_at);
    }

    public function test_google_workspace_email_can_link_to_existing_manual_account(): void
    {
        $existing = User::create([
            'email' => 'student@kampus.test', 'password' => bcrypt('password123'), 'role' => 'user',
        ]);
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-workspace');
        $googleUser->shouldReceive('getName')->andReturn('Mahasiswa');
        $googleUser->shouldReceive('getEmail')->andReturn('student@kampus.test');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true, 'hd' => 'kampus.test']);
        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/auth/callback?status=success');
        $this->assertDatabaseHas('users', ['id' => $existing->id, 'google_id' => 'google-workspace']);
        $this->assertNotNull($existing->fresh()->email_verified_at);
    }

    public function test_new_google_account_with_external_email_still_requires_email_verification(): void
    {
        Notification::fake();
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-new-external');
        $googleUser->shouldReceive('getName')->andReturn('Pengguna Baru');
        $googleUser->shouldReceive('getEmail')->andReturn('new@example.test');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/auth/callback?status=success');
        $created = User::where('google_id', 'google-new-external')->firstOrFail();
        $this->assertNull($created->email_verified_at);
        Notification::assertSentTo($created, VerifyEmail::class);
    }

    public function test_google_callback_never_replaces_another_google_link(): void
    {
        $existing = User::create([
            'email' => 'siti@gmail.com', 'password' => bcrypt('password123'),
            'google_id' => 'google-original', 'role' => 'user',
        ]);
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-other');
        $googleUser->shouldReceive('getName')->andReturn('Siti');
        $googleUser->shouldReceive('getEmail')->andReturn('siti@gmail.com');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/login?error=google_account_conflict');
        $this->assertDatabaseHas('users', ['id' => $existing->id, 'google_id' => 'google-original']);
        $this->assertGuest('web');
    }

    public function test_pending_google_link_cannot_attach_to_a_different_manual_account(): void
    {
        $first = User::create(['email' => 'first@example.test', 'password' => bcrypt('password123')]);
        $second = User::create(['email' => 'second@example.test', 'password' => bcrypt('password123')]);
        $this->withSession(['pending_google_link' => [
            'google_id' => 'google-first', 'email' => 'first@example.test',
            'expires_at' => now()->addMinutes(10)->timestamp,
        ]])->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/login', 'X-Requested-With' => 'XMLHttpRequest']);

        $this->postJson('/api/auth/login', ['email' => 'second@example.test', 'password' => 'password123'])
            ->assertOk()->assertJsonPath('googleLinkedNow', false);
        $this->assertDatabaseHas('users', ['id' => $first->id, 'google_id' => null]);
        $this->assertDatabaseHas('users', ['id' => $second->id, 'google_id' => null]);
        $this->assertNull(session('pending_google_link'));
    }

    public function test_existing_google_account_is_marked_verified_after_google_confirms_email(): void
    {
        $user = User::create([
            'google_id' => 'google-old', 'name' => 'Akun Lama',
            'email' => 'akunlama@gmail.com', 'password' => bcrypt('password123'),
        ]);
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-old');
        $googleUser->shouldReceive('getName')->andReturn('Akun Lama');
        $googleUser->shouldReceive('getEmail')->andReturn('akunlama@gmail.com');
        $googleUser->shouldReceive('getAvatar')->andReturn(null);
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $provider = Mockery::mock('Laravel\\Socialite\\Two\\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/auth/callback?status=success');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_google_callback_rejects_unverified_email(): void
    {
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getEmail')->andReturn('unverified@example.test');
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => false]);
        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=fake-code')
            ->assertRedirect('http://localhost:3000/login?error=google_unverified_email');
        $this->assertGuest('web');
    }

    public function test_google_callback_rejects_mismatched_state(): void
    {
        config(['services.google.client_id' => 'dummy-client-id', 'services.google.client_secret' => 'dummy-client-secret']);
        $this->withSession(['state' => 'expected-state'])
            ->get('/api/auth/google/callback?code=fake-code&state=wrong-state')
            ->assertRedirect('http://localhost:3000/login?error=google_failed');
        $this->assertGuest('web');
    }

    public function test_google_callback_handles_user_cancellation(): void
    {
        $response = $this->get('/api/auth/google/callback?error=access_denied');

        $response->assertRedirect('http://localhost:3000/login?error=google_cancelled');
        $this->assertGuest('web');
    }

    public function test_google_cancellation_returns_to_configured_public_frontend(): void
    {
        config()->set('app.frontend_url', 'https://himanika.wsmif.myhost.id');

        $this->get('/api/auth/google/callback?error=access_denied')
            ->assertRedirect('https://himanika.wsmif.myhost.id/login?error=google_cancelled');
    }
}
