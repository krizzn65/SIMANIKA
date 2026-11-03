<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OprecPendingEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_who_opened_oprec_but_never_sent_the_form(): void
    {
        $admin = $this->verifiedUser(['name' => 'Admin', 'email' => 'admin-pend@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $leader = $this->verifiedUser(['name' => 'Pengurus', 'email' => 'leader-pend@example.test', 'password' => 'secret-password']);
        $leader->forceFill(['role' => 'leader'])->save();
        $sent = $this->verifiedUser(['name' => 'Sudah Kirim', 'email' => 'sent@example.test', 'password' => 'secret-password']);
        $unsent = $this->verifiedUser(['name' => 'Belum Kirim', 'email' => 'unsent@example.test', 'password' => 'secret-password']);
        $oprec = Oprec::create(['periode' => '2026/2027', 'schema_version' => '1', 'form_fields' => [], 'faq' => []]);
        foreach ([$sent, $unsent] as $user) {
            DB::table('oprec_enrollments')->insert(['oprec_id' => $oprec->id, 'user_id' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
        }
        OprecRegistration::create(['oprec_id' => $oprec->id, 'user_id' => $sent->id, 'nim' => 'E1', 'tanggal_lahir' => '2004-01-01', 'form_data' => [], 'status' => 'pending']);

        $this->actingAs($admin, 'sanctum')->getJson("/api/admin/oprec/{$oprec->id}/registrants/pending")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.email', 'unsent@example.test');
        $this->actingAs($leader, 'sanctum')->getJson("/api/admin/oprec/{$oprec->id}/registrants/pending")->assertForbidden();
    }
}
