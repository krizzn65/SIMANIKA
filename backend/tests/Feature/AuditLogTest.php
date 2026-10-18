<?php

namespace Tests\Feature;

use App\Models\AuditEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        config()->set('admin.email', 'root-log@example.test');
        $user = User::create(['name' => 'Admin Utama', 'email' => 'root-log@example.test', 'password' => 'secret-password']);
        $user->forceFill(['role' => 'super_admin'])->save();
        return $user;
    }

    public function test_only_official_super_admin_can_read_filtered_log_and_safe_detail(): void
    {
        $super = $this->superAdmin();
        $admin = User::create(['name' => 'Admin', 'email' => 'admin-log@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $target = User::create(['name' => 'Peserta', 'email' => 'target-log@example.test', 'password' => 'secret-password']);
        $this->getJson('/api/admin/logs')->assertUnauthorized();
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/logs')->assertForbidden();

        $this->actingAs($super, 'sanctum')->putJson('/api/admin/users/'.$target->id, [
            'name' => 'Peserta', 'email' => 'target-log@example.test', 'role' => 'leader',
            'password' => 'must-not-be-logged',
        ])->assertOk();
        $entry = AuditEntry::where('action', 'users.update')->firstOrFail();
        $this->assertSame('activity', $entry->kind);
        $this->assertSame($super->id, $entry->actor_id);
        $this->assertSame('user', $entry->context['before']['role']);
        $this->assertSame('leader', $entry->context['after']['role']);
        $this->assertNotContains('password', $entry->context['fields']);
        $this->assertStringNotContainsString('must-not-be-logged', json_encode($entry->toArray()));

        $this->getJson('/api/admin/logs?module=users&result=success&q=Pengguna')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $entry->id)
            ->assertJsonPath('stats.activity', 1);
        $this->getJson('/api/admin/logs/'.$entry->id)->assertOk()
            ->assertJsonPath('data.context.before.role', 'user')
            ->assertJsonPath('data.context.after.role', 'leader');
        $today = now('Asia/Jakarta')->format('Y-m-d');
        $this->getJson("/api/admin/logs?from={$today}&to={$today}")->assertOk()->assertJsonPath('meta.total', 3);
        $this->getJson('/api/admin/logs?kind=invalid')->assertUnprocessable();
        $this->getJson('/api/admin/logs?from=2026-10-14&to=2026-10-13')->assertUnprocessable();
    }

    public function test_failed_login_is_recorded_without_credentials_and_access_denial_is_security_event(): void
    {
        $super = $this->superAdmin();
        $this->postJson('/api/auth/login', ['email' => 'unknown@example.test', 'password' => 'private-secret'])
            ->assertUnprocessable();
        $login = AuditEntry::where('action', 'auth.login')->firstOrFail();
        $this->assertSame('security', $login->kind);
        $this->assertSame('failed', $login->result);
        $this->assertNull($login->actor_id);
        $this->assertStringNotContainsString('unknown@example.test', json_encode($login->toArray()));
        $this->assertStringNotContainsString('private-secret', json_encode($login->toArray()));

        $user = User::create(['email' => 'ordinary-log@example.test', 'password' => 'secret-password']);
        $this->actingAs($user, 'sanctum')->getJson('/api/admin/logs')->assertForbidden();
        $this->assertDatabaseHas('audit_entries', ['kind' => 'security', 'actor_id' => $user->id, 'http_status' => 403]);
        $this->actingAs($super, 'sanctum')->getJson('/api/admin/logs?kind=security')->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_server_error_is_recorded_without_exception_message(): void
    {
        $super = $this->superAdmin();
        Route::middleware('api')->get('/api/audit-test-error', fn () => throw new \RuntimeException('secret-diagnostic-value'));
        $this->getJson('/api/audit-test-error')->assertStatus(500)
            ->assertJsonPath('message', 'Layanan sedang bermasalah. Coba lagi nanti.')
            ->assertHeader('X-Request-ID');
        $entry = AuditEntry::where('kind', 'error')->firstOrFail();
        $this->assertSame('HTTP_500', $entry->context['error_type']);
        $this->assertStringNotContainsString('secret-diagnostic-value', json_encode($entry->toArray()));
        $this->actingAs($super, 'sanctum')->getJson('/api/admin/logs?kind=error')->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_unofficial_super_admin_role_cannot_open_logs(): void
    {
        config()->set('admin.email', 'official@example.test');
        $impostor = User::create(['email' => 'impostor-log@example.test', 'password' => 'secret-password']);
        $impostor->forceFill(['role' => 'super_admin'])->save();
        $this->actingAs($impostor, 'sanctum')->getJson('/api/admin/logs')->assertForbidden();
    }

    public function test_auth_logs_distinguish_manual_and_google_methods(): void
    {
        $super = $this->superAdmin();
        $user = User::create(['name' => 'Budi', 'email' => 'budi-test@example.test', 'password' => bcrypt('secret-123')]);

        // 1. Manual Login Success
        $this->postJson('/api/auth/login', ['email' => 'budi-test@example.test', 'password' => 'secret-123', 'remember' => true])
            ->assertOk();
        $manualEntry = AuditEntry::where('action', 'auth.login')->where('result', 'success')->firstOrFail();
        $this->assertSame('manual', $manualEntry->context['auth_method']);
        $this->assertTrue($manualEntry->context['remember_me']);
        $this->assertStringContainsString('Manual', $manualEntry->summary);

        // 2. Google OAuth Callback Success creates distinct Google log
        config()->set('services.google.client_id', 'dummy-client-id');
        config()->set('services.google.client_secret', 'dummy-client-secret');

        $googleUser = \Mockery::mock(\Laravel\Socialite\Two\User::class);
        $googleUser->shouldReceive('getId')->andReturn('google-unique-id-999');
        $googleUser->shouldReceive('getName')->andReturn('Siti Google');
        $googleUser->shouldReceive('getEmail')->andReturn('siti.google@example.test');
        $googleUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');
        $googleUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);

        $provider = \Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($googleUser);
        \Laravel\Socialite\Facades\Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $this->get('/api/auth/google/callback?code=valid-code')->assertRedirect();

        $googleRegister = AuditEntry::where('action', 'auth.register')->where('result', 'success')->firstOrFail();
        $this->assertSame('google', $googleRegister->context['auth_method']);
        $this->assertStringContainsString('Google', $googleRegister->summary);

        // Superadmin opens log and checks detail
        $res = $this->actingAs($super, 'sanctum')->getJson('/api/admin/logs/'.$googleRegister->id)->assertOk();
        $this->assertSame('google', $res->json('data.authMethod'));
        $this->assertSame('Google OAuth 2.0', $res->json('data.context.auth_label'));
    }
}
