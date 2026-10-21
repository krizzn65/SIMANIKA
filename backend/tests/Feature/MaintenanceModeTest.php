<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MaintenanceModeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_toggles_maintenance_and_public_status_follows(): void
    {
        Storage::fake('local');
        $admin = $this->verifiedUser(['name' => 'Admin', 'email' => 'admin-mt@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $leader = $this->verifiedUser(['name' => 'Pengurus', 'email' => 'leader-mt@example.test', 'password' => 'secret-password']);
        $leader->forceFill(['role' => 'leader'])->save();

        $this->getJson('/api/public/status')->assertOk()->assertJsonPath('data.maintenance', false);
        $this->putJson('/api/admin/maintenance', ['maintenance' => true])->assertUnauthorized();
        $this->actingAs($leader, 'sanctum')->putJson('/api/admin/maintenance', ['maintenance' => true])->assertForbidden();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/maintenance', ['maintenance' => true, 'message' => ' Upgrade server '])
            ->assertOk()->assertJsonPath('data.message', 'Upgrade server');
        $this->getJson('/api/public/status')->assertJsonPath('data.maintenance', true)->assertJsonPath('data.message', 'Upgrade server');

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/maintenance', ['maintenance' => false])->assertOk();
        $this->getJson('/api/public/status')->assertJsonPath('data.maintenance', false);
    }
}
