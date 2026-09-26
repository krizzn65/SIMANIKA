<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\OprecStage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OprecTestReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_scores_are_private_validated_unique_per_reviewer_and_ranked_within_division(): void
    {
        config()->set('admin.email', 'review-admin@example.test');
        $admin = User::create(['email' => 'review-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $outsider = User::create(['email' => 'outsider@example.test', 'password' => 'password-testing-123']);
        $secondReviewer = User::create(['email' => 'future-reviewer@example.test', 'password' => 'password-testing-123']);
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => []]);
        $division = $oprec->divisions()->create(['nama' => 'Kominfo', 'sort_order' => 0]);
        $otherDivision = $oprec->divisions()->create(['nama' => 'Keilmuan', 'sort_order' => 1]);
        $stage = OprecStage::create(['oprec_id' => $oprec->id, 'type' => 'test_tulis', 'headline' => 'Tes Tulis',
            'tanggal_buka' => now()->subDay(), 'tanggal_tutup' => now()->addDay(), 'published' => true,
            'form_fields' => [['name' => 'motivasi', 'label' => 'Motivasi', 'type' => 'textarea', 'required' => true]]]);
        $submissions = [];
        foreach ([$division->id, $division->id, $otherDivision->id] as $index => $divisionId) {
            $participant = User::create(['email' => "participant{$index}@example.test", 'password' => 'password-testing-123']);
            $registration = OprecRegistration::create(['oprec_id' => $oprec->id, 'user_id' => $participant->id,
                'nim' => "NIM{$index}", 'tanggal_lahir' => '2004-01-01', 'form_data' => [], 'divisi_pilihan_1' => $divisionId]);
            $submissions[] = DB::table('oprec_test_submissions')->insertGetId(['oprec_stage_id' => $stage->id,
                'oprec_registration_id' => $registration->id, 'user_id' => $participant->id,
                'answers' => json_encode(['motivasi' => "Jawaban {$index}"]), 'created_at' => now(), 'updated_at' => now()]);
        }
        $url = "/api/admin/oprec/{$oprec->id}/stages/{$stage->id}/answers";
        $this->getJson($url)->assertUnauthorized();
        $this->actingAs($outsider, 'sanctum')->getJson($url)->assertForbidden();
        $this->putJson("{$url}/{$submissions[0]}/score", ['score' => 80])->assertForbidden();

        $this->actingAs($admin, 'sanctum')->putJson("{$url}/{$submissions[0]}/score", ['score' => 101])->assertUnprocessable();
        $this->putJson("{$url}/{$submissions[0]}/score", ['score' => 90.123])->assertUnprocessable();
        $this->putJson("{$url}/{$submissions[0]}/score", ['score' => 90, 'note' => 'Rapi'])->assertOk();
        $this->putJson("{$url}/{$submissions[0]}/score", ['score' => 80])->assertOk();
        $this->assertDatabaseCount('oprec_test_scores', 1);
        DB::table('oprec_test_scores')->insert(['submission_id' => $submissions[0], 'reviewer_id' => $secondReviewer->id,
            'score' => 100, 'created_at' => now(), 'updated_at' => now()]);
        $this->putJson("{$url}/{$submissions[1]}/score", ['score' => 90])->assertOk();
        $this->putJson("{$url}/{$submissions[2]}/score", ['score' => 95])->assertOk();

        $response = $this->getJson("{$url}?division_id={$division->id}")->assertOk()
            ->assertJsonPath('fields.0.label', 'Motivasi')->assertJsonPath('meta.total', 2);
        $response->assertJsonPath('data.0.averageScore', 90)->assertJsonPath('data.0.scoreCount', 2)
            ->assertJsonPath('data.0.rank', 1)->assertJsonPath('data.1.rank', 1);
        $this->getJson("{$url}?division_id={$otherDivision->id}")->assertOk()->assertJsonPath('data.0.rank', 1);
        $this->getJson("{$url}?division_id=999999")->assertUnprocessable();
        $this->putJson("{$url}/999999/score", ['score' => 50])->assertNotFound();
    }
}
