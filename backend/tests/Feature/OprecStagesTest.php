<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OprecStagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_draft_is_private_and_test_answers_are_guarded_and_single_use(): void
    {
        config()->set('admin.email', 'oprec-admin@example.test');
        $admin = User::create(['email' => 'oprec-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $participant = User::create(['email' => 'participant@example.test', 'password' => 'password-testing-123']);
        $outsider = User::create(['email' => 'outsider@example.test', 'password' => 'password-testing-123']);
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'draft', 'headline' => 'Bergabung', 'schema_version' => '1', 'form_fields' => [], 'faq' => []]);
        $this->getJson('/api/public/oprec')->assertOk()->assertJsonPath('data', null);

        $registration = OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $participant->id, 'nim' => 'A12345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => [],
        ]);
        $stagePayload = [
            'type' => 'test_tulis', 'headline' => 'Tes Tulis', 'deskripsi' => 'Jawab soal',
            'tanggal_buka' => now()->subMinute()->toIso8601String(),
            'tanggal_tutup' => now()->addHour()->toIso8601String(), 'published' => false,
        ];
        $created = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/oprec/{$oprec->id}/stages", $stagePayload)
            ->assertCreated()->assertJsonPath('data.type', 'test_tulis');
        $stageId = $created->json('data.id');
        $this->putJson("/api/admin/oprec/{$oprec->id}/stages/{$stageId}/form", [
            'published' => true,
            'form_fields' => [['name' => 'soal_1', 'label' => 'Apa motivasimu?', 'type' => 'textarea', 'required' => true, 'maxLength' => 2000]],
        ])->assertOk()->assertJsonPath('data.published', true);

        $this->actingAs($outsider, 'sanctum')->getJson("/api/user/oprec/stages/{$stageId}/test")->assertForbidden();
        $this->actingAs($participant, 'sanctum')->getJson("/api/user/oprec/stages/{$stageId}/test")
            ->assertOk()->assertJsonPath('data.available', true)->assertJsonPath('data.formFields.0.name', 'soal_1');
        $this->postJson("/api/user/oprec/stages/{$stageId}/test", ['soal_1' => 'Saya ingin belajar.'])
            ->assertCreated()->assertJsonPath('data.submitted', true);
        $this->postJson("/api/user/oprec/stages/{$stageId}/test", ['soal_1' => 'Jawaban kedua'])
            ->assertStatus(409);
        $this->assertDatabaseHas('oprec_test_submissions', ['oprec_stage_id' => $stageId, 'oprec_registration_id' => $registration->id]);

        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/oprec/{$oprec->id}/stages/{$stageId}/form", [
            'published' => true,
            'form_fields' => [['name' => 'soal_1', 'label' => 'Soal berubah', 'type' => 'textarea', 'required' => true]],
        ])->assertUnprocessable();
    }
}
