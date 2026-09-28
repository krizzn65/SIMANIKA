<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OprecWrittenTestTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        config()->set('admin.email', 'test-admin@example.test');
        $admin = User::create(['email' => 'test-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        return $admin;
    }

    private function payload(int $divisionId): array
    {
        return [
            'headline' => 'Tes Tulis OPREC',
            'deskripsi' => 'Kerjakan dengan jujur.',
            'tanggal_buka' => now()->addDay()->toIso8601String(),
            'tanggal_tutup' => now()->addDays(2)->toIso8601String(),
            'questions' => [
                [
                    'id' => 'q_motivasi', 'label' => 'Mengapa ingin bergabung?',
                    'type' => 'paragraph', 'required' => true,
                    'options' => [], 'targetDivisions' => [],
                ],
                [
                    'id' => 'q_divisi', 'label' => 'Pilih prioritas',
                    'type' => 'single_choice', 'required' => true,
                    'options' => ['A', 'B'], 'targetDivisions' => [$divisionId],
                ],
            ],
        ];
    }

    public function test_only_admin_can_create_and_read_written_test_draft(): void
    {
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'draft', 'schema_version' => '1', 'form_fields' => []]);
        $division = $oprec->divisions()->create(['nama' => 'Humas', 'sort_order' => 0]);
        $payload = $this->payload($division->id);
        $url = "/api/admin/oprec/{$oprec->id}/written-test";

        $this->getJson($url)->assertUnauthorized();
        $user = User::create(['email' => 'test-user@example.test', 'password' => 'password-testing-123']);
        $this->actingAs($user, 'sanctum')->putJson($url, $payload)->assertForbidden();
        $this->actingAs($this->admin(), 'sanctum')->putJson($url, $payload)
            ->assertCreated()->assertJsonPath('data.published', false)
            ->assertJsonCount(2, 'data.questions');
        $this->getJson($url)->assertOk()->assertJsonPath('data.test.headline', 'Tes Tulis OPREC');
        $this->getJson('/api/admin/oprec/written-tests')->assertOk()
            ->assertJsonPath('data.0.written_test.headline', 'Tes Tulis OPREC');
        $this->assertDatabaseCount('oprec_stages', 1);

        $payload['headline'] = 'Tes Tulis Diperbarui';
        $this->putJson($url, $payload)->assertOk()->assertJsonPath('data.headline', 'Tes Tulis Diperbarui');
        $this->assertDatabaseCount('oprec_stages', 1);
    }

    public function test_invalid_options_and_cross_period_divisions_are_rejected(): void
    {
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'draft', 'schema_version' => '1', 'form_fields' => []]);
        $division = $oprec->divisions()->create(['nama' => 'Humas', 'sort_order' => 0]);
        $other = Oprec::create(['periode' => '2027/2028', 'status' => 'draft', 'schema_version' => '1', 'form_fields' => []]);
        $otherDivision = $other->divisions()->create(['nama' => 'Kominfo', 'sort_order' => 0]);
        $url = "/api/admin/oprec/{$oprec->id}/written-test";
        $payload = $this->payload($division->id);

        $payload['questions'][1]['options'] = ['Sama', 'sama'];
        $this->actingAs($this->admin(), 'sanctum')->putJson($url, $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('questions.1.options');
        $payload['questions'][1]['options'] = ['A', 'B'];
        $payload['questions'][1]['targetDivisions'] = [$otherDivision->id];
        $this->putJson($url, $payload)->assertUnprocessable()
            ->assertJsonValidationErrors('questions.1.targetDivisions');
        $this->assertDatabaseCount('oprec_stages', 0);
    }

    public function test_questions_are_locked_after_a_submission_exists(): void
    {
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => []]);
        $division = $oprec->divisions()->create(['nama' => 'Humas', 'sort_order' => 0]);
        $url = "/api/admin/oprec/{$oprec->id}/written-test";
        $payload = $this->payload($division->id);
        $this->actingAs($this->admin(), 'sanctum')->putJson($url, $payload)->assertCreated();

        $user = User::create(['email' => 'test-applicant@example.test', 'password' => 'password-testing-123']);
        $registration = OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $user->id,
            'nim' => 'E312345', 'tanggal_lahir' => '2004-01-01', 'form_data' => [],
        ]);
        $oprec->writtenTest->submissions()->create([
            'oprec_registration_id' => $registration->id, 'user_id' => $user->id,
            'answers' => ['q_motivasi' => 'Alasan saya'],
        ]);
        $payload['questions'][0]['label'] = 'Soal yang berubah';
        $this->putJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('questions');
        $this->assertDatabaseHas('oprec_stages', ['id' => $oprec->writtenTest->id, 'headline' => 'Tes Tulis OPREC']);
    }
}
