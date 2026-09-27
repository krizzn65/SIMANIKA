<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OprecDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_empty_oprec_but_not_one_with_registrants(): void
    {
        config()->set('admin.email', 'delete-oprec-admin@example.test');
        $admin = User::create(['email' => 'delete-oprec-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $empty = Oprec::create(['periode' => 'Empty', 'status' => 'draft', 'schema_version' => '1', 'form_fields' => []]);
        $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/oprec/{$empty->id}")->assertNoContent();
        $this->assertDatabaseMissing('oprecs', ['id' => $empty->id]);

        $filled = Oprec::create(['periode' => 'Filled', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => []]);
        $user = User::create(['email' => 'registered-oprec@example.test', 'password' => 'password-testing-123']);
        OprecRegistration::create(['oprec_id' => $filled->id, 'user_id' => $user->id, 'nim' => 'E12345', 'tanggal_lahir' => '2004-01-01', 'form_data' => []]);
        $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/oprec/{$filled->id}")->assertConflict();
        $this->assertDatabaseHas('oprecs', ['id' => $filled->id]);
    }
}
