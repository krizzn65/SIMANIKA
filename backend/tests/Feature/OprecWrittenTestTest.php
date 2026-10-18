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

    public function test_registration_and_written_test_keep_the_selected_wib_schedule_after_reload(): void
    {
        $oprec = Oprec::create(['periode' => 'WIB', 'status' => 'closed', 'schema_version' => '1',
            'form_fields' => [], 'tanggal_buka' => '2026-10-13T00:00:00+07:00',
            'tanggal_tutup' => '2026-10-13T23:59:59+07:00']);
        $stage = $oprec->writtenTest()->create(['type' => 'test_tulis', 'headline' => 'Tes WIB',
            'tanggal_buka' => '2026-10-14T08:30:00+07:00',
            'tanggal_tutup' => '2026-10-14T10:15:00+07:00', 'form_fields' => [], 'published' => false]);
        $this->assertSame('2026-10-13 00:00', $oprec->fresh()->tanggal_buka->timezone('Asia/Jakarta')->format('Y-m-d H:i'));
        $this->assertSame('2026-10-13 23:59', $oprec->fresh()->tanggal_tutup->timezone('Asia/Jakarta')->format('Y-m-d H:i'));
        $this->assertSame('2026-10-14 08:30', $stage->fresh()->tanggal_buka->timezone('Asia/Jakarta')->format('Y-m-d H:i'));
        $this->assertSame('2026-10-14 10:15', $stage->fresh()->tanggal_tutup->timezone('Asia/Jakarta')->format('Y-m-d H:i'));

        $originalDriver = config('database.default');
        try {
            config()->set('database.default', 'pgsql');
            $registrationSchedule = new Oprec();
            $registrationSchedule->tanggal_buka = '2026-10-13T00:00:00+07:00';
            $this->assertSame('2026-10-12T17:00:00+00:00', $registrationSchedule->getAttributes()['tanggal_buka']);
            $registrationSchedule->setRawAttributes(['tanggal_buka' => '2026-10-12 17:00:00+00']);
            $this->assertSame('2026-10-13 00:00', $registrationSchedule->tanggal_buka->timezone('Asia/Jakarta')->format('Y-m-d H:i'));
            $testSchedule = new \App\Models\OprecStage();
            $testSchedule->tanggal_buka = '2026-10-14T08:30:00+07:00';
            $this->assertSame('2026-10-14T01:30:00+00:00', $testSchedule->getAttributes()['tanggal_buka']);
        } finally {
            config()->set('database.default', $originalDriver);
        }
    }

    private function admin(): User
    {
        config()->set('admin.email', 'test-admin@example.test');
        $admin = User::firstOrCreate(['email' => 'test-admin@example.test'], ['password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $admin->markEmailAsVerified();
        return $admin;
    }

    private function period(bool $published = true): Oprec
    {
        $oprec = Oprec::create([
            'periode' => '2026/2027', 'status' => $published ? 'closed' : 'draft',
            'first_published_at' => $published ? now()->subDay() : null,
            'schema_version' => '1', 'form_fields' => [],
        ]);
        foreach (['Humas', 'PSDM', 'KWU'] as $index => $name) {
            $oprec->divisions()->create(['nama' => $name, 'sort_order' => $index]);
        }
        return $oprec;
    }

    private function questions(Oprec $oprec): array
    {
        return [
            ['id' => 'q_motivasi', 'label' => 'Mengapa ingin bergabung?', 'type' => 'paragraph',
                'required' => true, 'options' => [], 'targetDivisions' => []],
            ['id' => 'q_divisi', 'label' => 'Pilih prioritas', 'type' => 'single_choice',
                'required' => true, 'options' => ['A', 'B'], 'targetDivisions' => [$oprec->divisions->first()->id]],
        ];
    }

    private function createTest(Oprec $oprec, bool $active = false): string
    {
        $url = "/api/admin/oprec/{$oprec->id}/written-test";
        $this->actingAs($this->admin(), 'sanctum')->postJson($url, [
            'tanggal_buka' => ($active ? now()->subMinute() : now()->addDay())->toIso8601String(),
            'tanggal_tutup' => ($active ? now()->addHour() : now()->addDays(2))->toIso8601String(),
        ])->assertCreated()->assertJsonPath('data.published', false);
        return $url;
    }

    private function applicant(Oprec $oprec): User
    {
        $user = $this->verifiedUser(['email' => 'applicant@example.test', 'password' => 'password-testing-123']);
        $ids = $oprec->divisions->pluck('id')->all();
        OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $user->id, 'nim' => 'E312345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Peserta Tes'],
            'divisi_pilihan_1' => $ids[0], 'divisi_pilihan_2' => $ids[1], 'divisi_pilihan_3' => $ids[2],
        ]);
        return $user;
    }

    public function test_create_requires_admin_and_previously_opened_registration(): void
    {
        $draft = $this->period(false);
        $url = "/api/admin/oprec/{$draft->id}/written-test";
        $schedule = ['tanggal_buka' => now()->addDay()->toIso8601String(), 'tanggal_tutup' => now()->addDays(2)->toIso8601String()];
        $this->postJson($url, $schedule)->assertUnauthorized();
        $user = $this->verifiedUser(['email' => 'user@example.test', 'password' => 'password-testing-123']);
        $this->actingAs($user, 'sanctum')->postJson($url, $schedule)->assertForbidden();
        $this->actingAs($this->admin(), 'sanctum')->postJson($url, $schedule)->assertUnprocessable();
        $this->assertDatabaseCount('oprec_stages', 0);

        $draft->update(['first_published_at' => now()->subDay(), 'status' => 'closed']);
        $this->postJson($url, $schedule)->assertCreated()->assertJsonPath('data.headline', 'Tes Tulis OPREC 2026/2027');
        $this->postJson($url, $schedule)->assertStatus(409);
        $this->getJson('/api/admin/oprec/written-tests')->assertOk()
            ->assertJsonPath('data.0.written_test.published', false);
        $this->assertDatabaseCount('oprec_stages', 1);
    }

    public function test_questions_publish_automatically_and_validate_options_and_divisions(): void
    {
        $oprec = $this->period();
        $url = $this->createTest($oprec);
        $stage = $oprec->writtenTest;
        $this->assertCount(0, $stage->form_fields);

        $questions = $this->questions($oprec);
        $payload = [
            'headline' => $stage->headline, 'deskripsi' => '',
            'tanggal_buka' => $stage->tanggal_buka->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup->toIso8601String(),
            'questions' => $questions,
        ];
        $invalid = $payload;
        $invalid['questions'][1]['options'] = ['Sama', 'sama'];
        $this->putJson($url, $invalid)->assertUnprocessable()->assertJsonValidationErrors('questions.1.options');
        $invalid = $payload;
        $invalid['questions'][1]['targetDivisions'] = [999999];
        $this->putJson($url, $invalid)->assertUnprocessable()->assertJsonValidationErrors('questions.1.targetDivisions');
        $this->putJson($url, $payload)->assertOk()->assertJsonPath('data.published', true)->assertJsonCount(2, 'data.questions');
    }

    public function test_only_submitted_applicant_sees_test_and_can_submit_once(): void
    {
        $oprec = $this->period();
        $url = $this->createTest($oprec, true);
        $stage = $oprec->writtenTest;
        $questions = $this->questions($oprec);
        $this->putJson($url, [
            'headline' => $stage->headline, 'deskripsi' => '',
            'tanggal_buka' => $stage->tanggal_buka->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup->toIso8601String(),
            'questions' => $questions,
        ])->assertOk();

        $user = $this->verifiedUser(['email' => 'outsider@example.test', 'password' => 'password-testing-123']);
        $participantUrl = "/api/user/oprec/{$oprec->id}/written-test";
        $this->actingAs($user, 'sanctum')->getJson($participantUrl)->assertNotFound();
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Jawaban']])->assertNotFound();

        $this->actingAs($this->applicant($oprec), 'sanctum')->getJson($participantUrl)
            ->assertOk()->assertJsonPath('data.active', true)->assertJsonCount(2, 'data.questions');
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Lengkap']])
            ->assertUnprocessable()->assertJsonValidationErrors('answers.q_divisi');
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Lengkap', 'q_divisi' => 'X']])
            ->assertUnprocessable()->assertJsonValidationErrors('answers.q_divisi');
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Lengkap', 'q_divisi' => 'A']])
            ->assertCreated()->assertJsonPath('data.submitted', true);
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Lagi', 'q_divisi' => 'A']])->assertStatus(409);
        $this->assertDatabaseCount('oprec_test_submissions', 1);

        $this->actingAs($this->admin(), 'sanctum')->getJson($url.'/submissions')
            ->assertOk()->assertJsonPath('data.0.name', 'Peserta Tes')
            ->assertJsonPath('data.0.answers.q_motivasi', 'Lengkap')->assertJsonCount(3, 'questions');
        $submissionId = $stage->submissions()->first()->id;
        $this->getJson($url.'/submissions/'.$submissionId)->assertOk()->assertJsonPath('data.nim', 'E312345');
        $this->deleteJson($url.'/submissions/'.$submissionId)->assertNoContent();
        $this->actingAs($oprec->registrations()->first()->user, 'sanctum')
            ->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Ulang', 'q_divisi' => 'A']])->assertCreated();
    }

    public function test_questions_hidden_before_start_and_submission_closed_after_deadline(): void
    {
        $oprec = $this->period();
        $url = $this->createTest($oprec);
        $stage = $oprec->writtenTest;
        $this->putJson($url, [
            'headline' => $stage->headline, 'deskripsi' => '',
            'tanggal_buka' => $stage->tanggal_buka->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup->toIso8601String(),
            'questions' => $this->questions($oprec),
        ])->assertOk();
        $participantUrl = "/api/user/oprec/{$oprec->id}/written-test";
        $this->actingAs($this->applicant($oprec), 'sanctum')->getJson($participantUrl)
            ->assertOk()->assertJsonPath('data.active', false)->assertJsonCount(0, 'data.questions');
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Terlalu awal']])->assertStatus(409);

        $stage->update(['tanggal_buka' => now()->subDays(2), 'tanggal_tutup' => now()->subDay()]);
        $this->getJson($participantUrl)->assertOk()->assertJsonCount(0, 'data.questions');
        $this->postJson($participantUrl, ['answers' => ['q_motivasi' => 'Terlambat']])->assertStatus(409);
    }
    public function test_schedule_and_questions_are_locked_after_test_starts(): void
    {
        $oprec = $this->period();
        $url = $this->createTest($oprec, true);
        $stage = $oprec->writtenTest;
        $payload = [
            'headline' => $stage->headline, 'deskripsi' => '',
            'tanggal_buka' => $stage->tanggal_buka->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup->toIso8601String(),
            'questions' => $this->questions($oprec),
        ];
        $this->putJson($url, $payload)->assertOk();
        $reorderedKeys = $payload;
        $reorderedKeys['questions'] = array_map(fn ($question) => array_reverse($question, true), $payload['questions']);
        $this->putJson($url, $reorderedKeys)->assertOk();
        $reorderedQuestions = $payload;
        $reorderedQuestions['questions'] = array_reverse($payload['questions']);
        $this->putJson($url, $reorderedQuestions)->assertUnprocessable()->assertJsonValidationErrors('questions');
        $changedSchedule = $payload;
        $changedSchedule['tanggal_tutup'] = now()->addHours(2)->toIso8601String();
        $this->putJson($url, $changedSchedule)->assertUnprocessable()->assertJsonValidationErrors('tanggal_buka');
        $changedQuestions = $payload;
        $changedQuestions['questions'][0]['label'] = 'Pertanyaan baru';
        $this->putJson($url, $changedQuestions)->assertUnprocessable()->assertJsonValidationErrors('questions');
        $blankLabel = $payload;
        $blankLabel['questions'][0]['label'] = '   ';
        $this->putJson($url, $blankLabel)->assertUnprocessable()->assertJsonValidationErrors('questions.0.label');
    }

    public function test_optional_answers_can_be_empty_and_division_specific_questions_are_hidden(): void
    {
        $oprec = $this->period();
        $other = $oprec->divisions()->create(['nama' => 'Ristek', 'sort_order' => 4]);
        $url = $this->createTest($oprec, true);
        $stage = $oprec->writtenTest;
        $this->putJson($url, [
            'headline' => $stage->headline, 'deskripsi' => '',
            'tanggal_buka' => $stage->tanggal_buka->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup->toIso8601String(),
            'questions' => [
                ['id' => 'q_optional', 'label' => 'Opsional', 'type' => 'short_text',
                    'required' => false, 'options' => [], 'targetDivisions' => []],
                ['id' => 'q_ristek', 'label' => 'Khusus Ristek', 'type' => 'paragraph',
                    'required' => true, 'options' => [], 'targetDivisions' => [$other->id]],
            ],
        ])->assertOk();

        $participantUrl = "/api/user/oprec/{$oprec->id}/written-test";
        $this->actingAs($this->applicant($oprec), 'sanctum')->getJson($participantUrl)
            ->assertOk()->assertJsonCount(1, 'data.questions');
        $this->postJson($participantUrl, ['answers' => ['q_ristek' => 'Tidak berlaku']])
            ->assertUnprocessable()->assertJsonValidationErrors('answers');
        $this->postJson($participantUrl, ['answers' => []])->assertCreated();
        $this->assertDatabaseHas('oprec_test_submissions', ['oprec_stage_id' => $stage->id]);
    }

}
