<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role, string $email): User
    {
        $user = User::create(['name' => $role, 'email' => $email, 'password' => 'password-testing-123']);
        $user->forceFill(['role' => $role])->save();
        return $user;
    }

    public function test_each_role_is_limited_to_its_admin_api_area(): void
    {
        config()->set('admin.email', 'official@example.test');
        $cases = [
            ['super_admin', 'official@example.test', [200, 200, 200, 200]],
            ['admin', 'admin@example.test', [403, 200, 200, 200]],
            ['leader', 'leader@example.test', [403, 403, 200, 403]],
            ['kwu', 'kwu@example.test', [403, 403, 403, 403]],
            ['user', 'user@example.test', [403, 403, 403, 403]],
        ];

        foreach ($cases as [$role, $email, $expected]) {
            $this->actingAs($this->account($role, $email), 'sanctum');
            foreach (['/api/admin/users', '/api/admin/events', '/api/admin/oprec', '/api/admin/dashboard'] as $index => $path) {
                $this->getJson($path)->assertStatus($expected[$index]);
            }
        }
    }

    public function test_only_official_super_admin_can_assign_roles_and_cannot_assign_another_super_admin(): void
    {
        config()->set('admin.email', 'official@example.test');
        $this->postJson('/api/auth/register', ['email' => 'attacker@example.test', 'password' => 'password-testing-123', 'role' => 'admin'])->assertUnprocessable();
        $super = $this->account('super_admin', 'official@example.test');
        $admin = $this->account('admin', 'admin@example.test');
        $target = $this->account('user', 'target@example.test');

        $payload = ['name' => 'Target', 'email' => 'target@example.test', 'role' => 'leader'];
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/users/{$target->id}", $payload)->assertForbidden();
        $this->actingAs($super, 'sanctum')->putJson("/api/admin/users/{$target->id}", $payload)->assertOk();
        $this->assertDatabaseHas('users', ['id' => $target->id, 'role' => 'leader']);
        $this->actingAs($target, 'sanctum')->putJson('/api/auth/profile', ['role' => 'admin'])->assertUnprocessable();
        $this->actingAs($super, 'sanctum');

        $this->putJson("/api/admin/users/{$target->id}", [...$payload, 'role' => 'super_admin'])->assertUnprocessable();
        $this->putJson("/api/admin/users/{$super->id}", [...$payload, 'email' => $super->email, 'role' => 'admin'])->assertUnprocessable();
        $this->deleteJson("/api/admin/users/{$super->id}")->assertUnprocessable();
    }

    public function test_super_admin_is_pinned_first_and_official_email_is_immutable(): void
    {
        config()->set('admin.email', 'official@example.test');
        $super = $this->account('super_admin', 'official@example.test');
        $this->account('user', 'newer@example.test');
        $this->actingAs($super, 'sanctum')->getJson('/api/admin/users?sort_by=created_at&sort_dir=desc')
            ->assertOk()->assertJsonPath('data.0.id', $super->id);

        $this->putJson('/api/auth/profile', ['email' => 'changed@example.test'])->assertUnprocessable();
        $this->putJson("/api/admin/users/2", ['name' => 'Other', 'email' => 'official@example.test', 'role' => 'admin'])->assertUnprocessable();
    }

    public function test_mismatched_super_admin_role_has_no_privileges(): void
    {
        config()->set('admin.email', 'official@example.test');
        $stray = $this->account('super_admin', 'stray@example.test');
        $this->actingAs($stray, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->getJson('/api/auth/me')->assertJsonPath('data.role', 'user');
    }

    public function test_forbidden_write_routes_and_sole_super_admin_constraint(): void
    {
        config()->set('admin.email', 'official@example.test');
        $this->account('super_admin', 'official@example.test');
        $leader = $this->account('leader', 'leader@example.test');
        $kwu = $this->account('kwu', 'kwu@example.test');

        $this->actingAs($leader, 'sanctum')->postJson('/api/admin/events', [])->assertForbidden();
        $this->actingAs($kwu, 'sanctum')->postJson('/api/admin/oprec', [])->assertForbidden();
        $this->assertTrue($kwu->canAccessArea('merchandise'));
        $this->assertFalse($kwu->canAccessArea('users'));
        $this->assertFalse($leader->canAccessArea('merchandise'));

        $this->expectException(\Illuminate\Database\QueryException::class);
        $this->account('super_admin', 'another@example.test');
    }
}
