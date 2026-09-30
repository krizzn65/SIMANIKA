<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OprecAssessmentTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role, string $email): User
    {
        $user = User::create(['name' => $role, 'email' => $email, 'password' => 'password-testing-123']);
        $user->forceFill(['role' => $role])->save();
        return $user;
    }

    private function fixture(): array
    {
        config()->set('admin.email', 'official@example.test');
        $super = $this->account('super_admin', 'official@example.test');
        $admin = $this->account('admin', 'admin@example.test');
        $leader = $this->account('leader', 'leader@example.test');
        $leader2 = $this->account('leader', 'leader2@example.test');
        $user = $this->account('user', 'applicant@example.test');
        $period = Oprec::create(['periode' => '2026/2027', 'status' => 'closed', 'form_fields' => [], 'schema_version' => '1']);
        $divisions = collect(['BPH', 'Humas', 'PSDM'])->map(fn ($name, $i) => $period->divisions()->create(['nama' => $name, 'sort_order' => $i]));
        $registration = OprecRegistration::create([
            'oprec_id' => $period->id, 'user_id' => $user->id, 'nim' => 'E312345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Peserta Uji', 'angkatan' => '2024', 'jabatan_pilihan_1' => 'Sekretaris 2'],
            'divisi_pilihan_1' => $divisions[0]->id, 'divisi_pilihan_2' => $divisions[1]->id, 'divisi_pilihan_3' => $divisions[2]->id,
        ]);
        $stage = $period->writtenTest()->create(['type' => 'test_tulis', 'headline' => 'Tes', 'published' => true,
            'tanggal_buka' => now()->subDay(), 'tanggal_tutup' => now()->addDay(),
            'form_fields' => [['id' => 'q1', 'label' => 'Alasan', 'type' => 'paragraph', 'required' => true]]]);
        $submission = $stage->submissions()->create(['oprec_registration_id' => $registration->id, 'user_id' => $user->id, 'answers' => ['q1' => 'Saya ingin membantu.']]);
        return compact('super', 'admin', 'leader', 'leader2', 'user', 'period', 'registration', 'submission', 'divisions');
    }

    public function test_only_assigned_leader_can_read_and_score_and_admin_is_read_only(): void
    {
        $f = $this->fixture();
        $url = "/api/admin/oprec/{$f['period']->id}/assessment";
        $review = $url."/registrations/{$f['registration']->id}/review";
        $this->actingAs($f['user'], 'sanctum')->getJson($url)->assertForbidden();
        $this->actingAs($f['leader'], 'sanctum')->getJson($url)->assertForbidden();
        $this->patchJson($review, ['field' => 'pemahaman', 'value' => 8])->assertForbidden();
        $this->actingAs($f['admin'], 'sanctum')->getJson($url)->assertOk()->assertJsonPath('data.0.name', 'Peserta Uji');
        $this->patchJson($review, ['field' => 'pemahaman', 'value' => 8])->assertForbidden();
        $this->actingAs($f['super'], 'sanctum')->putJson($url."/assignments/{$f['leader']->id}")->assertNoContent();
        $this->actingAs($f['leader'], 'sanctum')->getJson($url)->assertOk()->assertJsonPath('data.0.reviews_hidden', true);
        $this->patchJson($review, ['field' => 'pemahaman', 'value' => '7,5'])->assertOk()->assertJsonPath('data.scores.pemahaman', 7.5);
        $this->actingAs($f['super'], 'sanctum')->deleteJson($url."/assignments/{$f['leader']->id}")->assertNoContent();
        $this->actingAs($f['leader'], 'sanctum')->getJson($url)->assertForbidden();
        $this->assertDatabaseHas('oprec_assessment_reviews', ['oprec_registration_id' => $f['registration']->id, 'reviewer_id' => $f['leader']->id]);
    }

    public function test_decimal_validation_totals_average_and_visibility(): void
    {
        $f = $this->fixture();
        $url = "/api/admin/oprec/{$f['period']->id}/assessment";
        $review = $url."/registrations/{$f['registration']->id}/review";
        $this->actingAs($f['super'], 'sanctum')->putJson($url."/assignments/{$f['leader']->id}")->assertNoContent();
        $this->putJson($url."/assignments/{$f['leader2']->id}")->assertNoContent();
        $this->actingAs($f['leader'], 'sanctum');
        foreach (['-1', '10.1', '7.25', 'abc'] as $invalid) {
            $this->patchJson($review, ['field' => 'pemahaman', 'value' => $invalid])->assertUnprocessable();
        }
        foreach (['pemahaman', 'kepribadian', 'public_speaking', 'kejujuran', 'problem_solving', 'kerja_sama'] as $criterion) {
            $this->patchJson($review, ['field' => $criterion, 'value' => '7,5'])->assertOk();
        }
        $this->getJson($url)->assertJsonPath('data.0.review.total', 75)
            ->assertJsonPath('data.0.average', 75)->assertJsonPath('data.0.reviews_hidden', false);
        $this->actingAs($f['leader2'], 'sanctum')->getJson($url)->assertJsonPath('data.0.average', null)
            ->assertJsonPath('data.0.reviews_hidden', true)->assertJsonCount(0, 'data.0.reviews');
        foreach (['pemahaman', 'kepribadian', 'public_speaking', 'kejujuran', 'problem_solving', 'kerja_sama'] as $criterion) {
            $this->patchJson($review, ['field' => $criterion, 'value' => 9])->assertOk();
        }
        $this->getJson($url)->assertJsonPath('data.0.review.total', 90)
            ->assertJsonPath('data.0.average', 82.5);
        foreach (['pemahaman', 'kepribadian', 'public_speaking', 'kejujuran', 'problem_solving', 'kerja_sama'] as $criterion) {
            $this->patchJson($review, ['field' => $criterion, 'value' => 10])->assertOk();
        }
        $this->getJson($url)->assertJsonPath('data.0.review.total', 100)
            ->assertJsonPath('data.0.average', 87.5);
    }

    public function test_only_super_admin_decides_and_publication_locks_all_writes(): void
    {
        $f = $this->fixture();
        $url = "/api/admin/oprec/{$f['period']->id}/assessment";
        $decision = $url."/registrations/{$f['registration']->id}/decision";
        $legacy = "/api/admin/oprec/{$f['period']->id}/registrants/{$f['registration']->id}";
        $payload = ['status' => 'accepted', 'accepted_division_id' => $f['divisions'][1]->id, 'accepted_position' => 'Staff Bidang Internal'];
        $this->actingAs($f['admin'], 'sanctum')->putJson($decision, $payload)->assertForbidden();
        $this->putJson($legacy, $payload)->assertForbidden();
        $this->actingAs($f['super'], 'sanctum')->putJson($decision, [...$payload, 'accepted_position' => 'Sekretaris 2'])->assertUnprocessable();
        $this->putJson($decision, $payload)->assertOk()->assertJsonPath('data.position', 'Staff Bidang Internal');
        $this->assertDatabaseCount('oprec_assessment_decision_logs', 1);
        $this->putJson($decision, ['status' => 'rejected'])->assertOk();
        $this->assertDatabaseCount('oprec_assessment_decision_logs', 2);
        $f['period']->update(['pengumuman_published' => true]);
        $this->putJson($decision, $payload)->assertStatus(409);
        $this->patchJson($url."/registrations/{$f['registration']->id}/review", ['field' => 'kejujuran', 'value' => 10])->assertStatus(409);
        $this->deleteJson("/api/admin/oprec/{$f['period']->id}/written-test/submissions/{$f['submission']->id}")->assertStatus(409);
        $this->deleteJson($legacy)->assertStatus(409);
    }
    public function test_filters_apply_before_pagination_and_use_only_the_current_reviewers_scores(): void
    {
        $f = $this->fixture();
        $url = "/api/admin/oprec/{$f['period']->id}/assessment";
        foreach (range(1, 21) as $index) {
            $registration = $f['registration']->replicate();
            $registration->user_id = $this->account('user', "filter{$index}@example.test")->id;
            $registration->nim = 'E31900'.$index;
            $registration->status = $index === 1 ? 'accepted' : 'pending';
            $registration->save();
            $submission = $f['submission']->replicate();
            $submission->oprec_registration_id = $registration->id;
            $submission->user_id = $registration->user_id;
            $submission->save();
            $scores = array_fill_keys(\App\Services\OprecAssessmentService::CRITERIA, $index <= 20 ? 0 : null);
            $scores['pemahaman'] = 0;
            DB::table('oprec_assessment_reviews')->insert($scores + [
                'oprec_registration_id' => $registration->id, 'reviewer_id' => $f['super']->id,
                'reviewer_name' => 'Super Admin', 'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        DB::table('oprec_assessment_reviews')->insert(array_fill_keys(\App\Services\OprecAssessmentService::CRITERIA, 10) + [
            'oprec_registration_id' => $f['registration']->id, 'reviewer_id' => $f['leader2']->id,
            'reviewer_name' => 'Penilai lain', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->actingAs($f['super'], 'sanctum')->getJson($url.'?page=2')->assertOk()->assertJsonPath('total', 22)->assertJsonCount(2, 'data');
        $this->getJson($url.'?review=complete')->assertOk()->assertJsonPath('total', 20)->assertJsonPath('data.0.review.total', 0);
        $this->getJson($url.'?review=incomplete')->assertOk()->assertJsonPath('total', 2);
        $this->getJson($url.'?review=complete&decision=accepted')->assertOk()->assertJsonPath('total', 1);
        $this->getJson($url.'?decision=pending')->assertOk()->assertJsonPath('total', 21);
        $this->getJson($url.'?review=invalid')->assertUnprocessable();
        $this->getJson($url.'?decision=invalid')->assertUnprocessable();
        $this->actingAs($f['admin'], 'sanctum')->getJson($url.'?review=complete')->assertForbidden();
        $this->getJson($url.'?decision=accepted')->assertOk()->assertJsonPath('is_reviewer', false)->assertJsonPath('total', 1);
    }

    public function test_save_summary_hides_other_reviews_when_own_scores_become_incomplete(): void
    {
        $f = $this->fixture();
        $url = "/api/admin/oprec/{$f['period']->id}/assessment";
        $this->actingAs($f['super'], 'sanctum')->putJson($url."/assignments/{$f['leader']->id}")->assertNoContent();
        DB::table('oprec_assessment_reviews')->insert(array_fill_keys(\App\Services\OprecAssessmentService::CRITERIA, 10) + [
            'oprec_registration_id' => $f['registration']->id, 'reviewer_id' => $f['super']->id,
            'reviewer_name' => 'Super Admin', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->actingAs($f['leader'], 'sanctum');
        foreach (\App\Services\OprecAssessmentService::CRITERIA as $field) {
            $response = $this->patchJson($url."/registrations/{$f['registration']->id}/review", ['field' => $field, 'value' => '7,5'])->assertOk();
        }
        $response->assertJsonPath('summary.average', 87.5)->assertJsonPath('summary.reviews_hidden', false)->assertJsonCount(2, 'summary.reviews');
        $this->patchJson($url."/registrations/{$f['registration']->id}/review", ['field' => 'kejujuran', 'value' => null])
            ->assertOk()->assertJsonPath('data.total', null)->assertJsonPath('summary.average', null)
            ->assertJsonPath('summary.reviews_hidden', true)->assertJsonCount(1, 'summary.reviews');
    }

}
