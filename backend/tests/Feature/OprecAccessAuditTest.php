<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecAccessAuditTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        Storage::fake('local');
        Storage::disk('local')->put('oprec/guidebooks/test-guidebook.pdf', '%PDF-1.4 test guidebook');
        $period = Oprec::create(['periode' => '2026/2027', 'status' => 'open', 'schema_version' => '1',
            'guidebook' => 'oprec/guidebooks/test-guidebook.pdf',
            'tanggal_buka' => now()->subHour(), 'tanggal_tutup' => now()->addHour(),
            'first_published_at' => now()->subHour(), 'link_grup_wa' => 'https://chat.whatsapp.com/PrivateRegistration',
            'form_fields' => [
                ['name' => 'nim', 'type' => 'text', 'required' => true],
                ['name' => 'tanggal_lahir', 'type' => 'date', 'required' => true],
                ['name' => 'nama', 'type' => 'text', 'required' => true],
                ['name' => 'angkatan', 'type' => 'select', 'required' => true, 'options' => [['value' => '2024', 'label' => '2024']]],
                ['name' => 'conditional_file', 'type' => 'file', 'required' => true, 'target_type' => 'specific', 'target_divisions' => ['Ristek']],
            ]]);
        $divisions = collect(['BPH', 'Humas', 'PSDM', 'Ristek'])->map(fn ($name) => $period->divisions()->create(['nama' => $name]));
        $owner = $this->verifiedUser(['email' => 'participant@audit.test', 'password' => 'audit-password']);
        $registration = $period->registrations()->create(['user_id' => $owner->id, 'nim' => 'E312345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Peserta Audit', 'angkatan' => '2024'],
            'divisi_pilihan_1' => $divisions[0]->id, 'divisi_pilihan_2' => $divisions[1]->id, 'divisi_pilihan_3' => $divisions[2]->id,
            'file_uploads' => ['cv' => "oprec/{$period->id}/cv.pdf"]]);
        $stage = $period->writtenTest()->create(['type' => 'test_tulis', 'headline' => 'Tes', 'published' => true,
            'tanggal_buka' => now()->subMinute(), 'tanggal_tutup' => now()->addHour(),
            'form_fields' => [['id' => 'reason', 'label' => 'Alasan', 'type' => 'short_text', 'required' => true]]]);
        $submission = $stage->submissions()->create(['user_id' => $owner->id, 'oprec_registration_id' => $registration->id,
            'answers' => ['reason' => 'Jawaban privat']]);
        $leader = $this->verifiedUser(['email' => 'leader@audit.test', 'password' => 'audit-password']);
        $leader->forceFill(['role' => 'leader'])->save();
        return compact('period', 'owner', 'leader', 'registration', 'stage', 'submission', 'divisions');
    }

    public function test_participant_workspace_reports_uploaded_field_names_without_private_paths(): void
    {
        $f = $this->fixture();
        $fields = $f['period']->form_fields;
        $fields[] = ['name' => 'ktm_sim_online', 'label' => 'Upload KTM/SIM Online', 'type' => 'file', 'required' => true];
        $f['period']->update(['form_fields' => $fields]);
        $privatePath = "oprec/{$f['period']->id}/private-ktm.pdf";
        $f['registration']->update(['file_uploads' => ['ktm_sim_online' => $privatePath, 'cv' => "oprec/{$f['period']->id}/cv.pdf"]]);

        $this->actingAs($f['owner'], 'sanctum')
            ->getJson("/api/user/oprec/workspace?oprec_id={$f['period']->id}")
            ->assertOk()
            ->assertJsonPath('data.registration.uploadedFileFields', ['ktm_sim_online'])
            ->assertDontSee($privatePath);
    }

    public function test_leader_cannot_bypass_assignment_or_manage_through_legacy_routes(): void
    {
        $f = $this->fixture();
        $base = "/api/admin/oprec/{$f['period']->id}";
        $this->actingAs($f['leader'], 'sanctum');
        $this->getJson('/api/admin/oprec')->assertOk()->assertDontSee('PrivateRegistration');
        $this->getJson('/api/admin/oprec/written-tests')->assertOk()->assertJsonMissingPath('data.0.written_test.form_fields');
        $this->getJson($base.'/assessment')->assertForbidden();
        foreach ([false, true] as $assigned) {
            if ($assigned) DB::table('oprec_assessment_assignments')->insert(['oprec_id' => $f['period']->id, 'user_id' => $f['leader']->id,
                'assigned_by' => $f['owner']->id, 'created_at' => now(), 'updated_at' => now()]);
            $this->getJson($base.'/registrants')->assertOk();
            foreach ([$base.'/written-test', $base.'/written-test/submissions',
                $base.'/written-test/submissions/'.$f['submission']->id,
                $base.'/written-test/submissions/'.$f['submission']->id.'/files/reason'] as $url) $this->getJson($url)->assertForbidden();
            foreach ([['POST', '/api/admin/oprec'], ['PUT', $base], ['DELETE', $base],
                ['POST', '/api/admin/oprec/upload-poster'], ['POST', '/api/admin/oprec/upload-logo'],
                ['POST', $base.'/registrants'],
                ['POST', $base.'/written-test'], ['PUT', $base.'/written-test'],
                ['DELETE', $base.'/written-test/submissions/'.$f['submission']->id],
                ['PUT', $base.'/registrants/'.$f['registration']->id.'/form'],
                ['DELETE', $base.'/registrants/'.$f['registration']->id], ['POST', $base.'/announcement']] as [$method, $url]) {
                $this->json($method, $url, [])->assertForbidden();
            }
        }
        $this->getJson($base.'/assessment')->assertOk();
        $this->getJson($base.'/assessment/'.$f['submission']->id)->assertOk()->assertJsonPath('data.answers.reason', 'Jawaban privat');
        $this->patchJson($base.'/assessment/registrations/'.$f['registration']->id.'/review', ['field' => 'pemahaman', 'value' => '8,5'])->assertOk();
        $this->putJson($base.'/assessment/registrations/'.$f['registration']->id.'/decision', ['status' => 'rejected'])->assertForbidden();
        DB::table('oprec_assessment_assignments')->where('user_id', $f['leader']->id)->update(['revoked_at' => now()]);
        $this->getJson($base.'/assessment')->assertForbidden();
        $this->getJson($base.'/assessment/'.$f['submission']->id)->assertForbidden();
        $this->getJson($base.'/assessment/'.$f['submission']->id.'/registration-files/cv')->assertForbidden();
        $this->patchJson($base.'/assessment/registrations/'.$f['registration']->id.'/review', ['field' => 'pemahaman', 'value' => 9])->assertForbidden();
        $this->assertDatabaseHas('oprec_assessment_reviews', ['oprec_registration_id' => $f['registration']->id, 'pemahaman' => 8.5]);
    }

    public function test_announcement_summary_does_not_expose_unassigned_participants_or_invitation(): void
    {
        $f = $this->fixture();
        $f['registration']->update(['status' => 'accepted', 'accepted_division_id' => $f['divisions'][0]->id, 'accepted_position' => 'Sekretaris 2']);
        $f['period']->update(['pengumuman_grup_wa' => 'https://chat.whatsapp.com/PrivateAccepted']);
        $url = "/api/admin/oprec/{$f['period']->id}/announcement";
        $this->actingAs($f['leader'], 'sanctum')->getJson($url)->assertOk()->assertJsonCount(0, 'participants.data')->assertJsonPath('can_read_participants', false)->assertDontSee('PrivateAccepted');
        DB::table('oprec_assessment_assignments')->insert(['oprec_id' => $f['period']->id, 'user_id' => $f['leader']->id,
            'assigned_by' => $f['owner']->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->getJson($url)->assertOk()->assertJsonPath('participants.data.0.nim', 'E312345')->assertDontSee('PrivateAccepted');
    }

    public function test_user_journey_rejects_forgery_duplicates_and_other_participants(): void
    {
        $f = $this->fixture();
        $user = $this->verifiedUser(['email' => 'newparticipant@audit.test', 'password' => 'audit-password']);
        $id = $f['period']->id;
        $payload = ['oprec_id' => $id, 'schema_version' => '1', 'nim' => ' e319999 ', 'tanggal_lahir' => '2004-01-01',
            'nama' => 'Peserta Baru', 'angkatan' => '2024', 'status_kepengurusan' => 'Anggota Baru',
            'persetujuan_data_benar' => 'on', 'persetujuan_penggunaan_data' => 'on', 'conditional_file' => ['forged' => 'unvalidated-array']];
        foreach ([1, 2, 3] as $rank) $payload["divisi_pilihan_$rank"] = (string) $f['divisions'][$rank - 1]->id;
        $payload['jabatan_pilihan_1'] = 'Sekretaris 2';
        $this->actingAs($user, 'sanctum')->getJson('/api/admin/oprec')->assertForbidden();
        $this->getJson("/api/user/oprec/$id/written-test")->assertNotFound();
        $this->getJson("/api/user/oprec/workspace?oprec_id=$id")->assertNotFound();
        $this->postJson('/api/user/oprec/enroll', ['oprec_id' => $id])->assertCreated();
        $this->postJson('/api/user/oprec/enroll', ['oprec_id' => $id])->assertOk();
        $this->postJson('/api/user/oprec/register', array_replace($payload, ['jabatan_pilihan_1' => 'Ketua Palsu']))->assertUnprocessable()->assertJsonValidationErrors('jabatan_pilihan_1');
        $this->postJson('/api/user/oprec/register', array_replace($payload, ['schema_version' => 'old']))->assertConflict();
        $this->postJson('/api/user/oprec/register', $payload)->assertCreated();
        $registration = $f['period']->registrations()->where('user_id', $user->id)->firstOrFail();
        $this->assertArrayNotHasKey('conditional_file', $registration->form_data);
        $this->assertEmpty($registration->file_uploads);
        $this->assertDatabaseMissing('oprec_enrollments', ['oprec_id' => $id, 'user_id' => $user->id]);
        $this->postJson('/api/user/oprec/register', $payload)->assertConflict();
        $this->getJson("/api/user/oprec/workspace?oprec_id=$id")->assertOk()->assertJsonPath('data.registration.nim', 'E319999');
        $this->postJson("/api/user/oprec/$id/written-test", ['answers' => ['reason' => 'Jawaban saya', 'foreign' => 'forged']])->assertUnprocessable();
        $this->postJson("/api/user/oprec/$id/written-test", ['answers' => ['reason' => 'Jawaban saya']])->assertCreated();
        $this->postJson("/api/user/oprec/$id/written-test", ['answers' => ['reason' => 'Ulang']])->assertConflict();
        $this->getJson("/api/user/oprec/$id/written-test")->assertOk()->assertJsonPath('data.submission.answers.reason', 'Jawaban saya')->assertDontSee('Jawaban privat');
        $f['period']->update(['status' => 'draft', 'pengumuman_published' => true, 'pengumuman_tanggal' => now()->subMinute()]);
        $registration->update(['status' => 'accepted']);
        $this->getJson("/api/user/oprec/workspace?oprec_id=$id")->assertOk()->assertJsonPath('data.announced', false)->assertJsonPath('data.registration.status', 'pending');
        $this->getJson('/api/user/dashboard')->assertOk()->assertJsonFragment(['status' => 'pending']);
        $f['period']->update(['status' => 'closed', 'pengumuman_published' => false]);
        $f['stage']->update(['tanggal_tutup' => now()->subMinute()]);
        config()->set('admin.email', 'super@audit.test');
        $super = $this->verifiedUser(['email' => 'super@audit.test', 'password' => 'audit-password']);
        $super->forceFill(['role' => 'super_admin'])->save();
        $this->actingAs($super, 'sanctum');
        $this->putJson("/api/admin/oprec/$id/assessment/registrations/{$registration->id}/decision", [
            'status' => 'accepted', 'accepted_division_id' => $f['divisions'][0]->id, 'accepted_position' => 'Sekretaris 2',
        ])->assertOk();
        $this->putJson("/api/admin/oprec/$id/assessment/registrations/{$f['registration']->id}/decision", ['status' => 'rejected'])->assertOk();
        $this->postJson("/api/admin/oprec/$id/announcement", [
            'title' => 'Hasil OPREC', 'description' => 'Hasil seleksi', 'release_at' => now()->addHour()->toIso8601String(),
            'whatsapp_url' => 'https://chat.whatsapp.com/AcceptedInvite',
            'poster' => UploadedFile::fake()->createWithContent('poster.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')),
        ])->assertOk();
        $this->actingAs($user, 'sanctum')->getJson("/api/user/oprec/workspace?oprec_id=$id")->assertOk()->assertJsonPath('data.registration.status', 'pending')->assertDontSee('AcceptedInvite');
        $this->travel(2)->hours();
        $this->getJson("/api/user/oprec/workspace?oprec_id=$id")->assertOk()->assertJsonPath('data.registration.status', 'accepted');
        $ticket = $this->postJson("/api/public/oprec/$id/announcement/verify", ['nim' => 'e319999', 'tanggal_lahir' => '2004-01-01'])->assertOk()->json('ticket');
        $this->postJson("/api/public/oprec/$id/announcement/result", ['ticket' => $ticket])->assertOk()->assertJsonPath('data.whatsapp_url', 'https://chat.whatsapp.com/AcceptedInvite');
    }

    public function test_admin_correction_returns_conflict_and_deletion_cleans_test_files(): void
    {
        $f = $this->fixture();
        $admin = $this->verifiedUser(['email' => 'admin@audit.test', 'password' => 'audit-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $other = $this->verifiedUser(['email' => 'other@audit.test', 'password' => 'audit-password']);
        $f['period']->registrations()->create(['user_id' => $other->id, 'nim' => 'E319999', 'tanggal_lahir' => '2004-01-01', 'form_data' => []]);
        $url = "/api/admin/oprec/{$f['period']->id}/registrants/{$f['registration']->id}";
        $payload = ['schema_version' => '1', 'nim' => 'E319999', 'tanggal_lahir' => '2004-01-01', 'nama' => 'Peserta Audit', 'angkatan' => '2024', 'status_kepengurusan' => 'Anggota Baru'];
        foreach ([1, 2, 3] as $rank) $payload["divisi_pilihan_$rank"] = (string) $f['divisions'][$rank - 1]->id;
        $payload['jabatan_pilihan_1'] = 'Sekretaris 2';
        $this->actingAs($admin, 'sanctum')->putJson($url.'/form', $payload)->assertConflict();
        $this->assertDatabaseHas('oprec_registrations', ['id' => $f['registration']->id, 'nim' => 'E312345']);
        $path = "oprec/test/{$f['stage']->id}/document.pdf";
        Storage::disk('local')->put($path, 'private');
        Storage::disk('local')->put("oprec/{$f['period']->id}/cv.pdf", 'private');
        $f['submission']->update(['answers' => ['document' => ['path' => $path, 'name' => 'document.pdf']]]);
        $this->deleteJson($url)->assertNoContent();
        Storage::disk('local')->assertMissing($path);
        Storage::disk('local')->assertMissing("oprec/{$f['period']->id}/cv.pdf");
        $this->assertDatabaseMissing('oprec_test_submissions', ['id' => $f['submission']->id]);
    }

    public function test_registration_upload_checks_content_size_and_cleans_duplicate_files(): void
    {
        $f = $this->fixture();
        $f['period']->update(['form_fields' => [...$f['period']->form_fields,
            ['name' => 'cv', 'label' => 'CV', 'type' => 'file', 'required' => true, 'accept' => ['.pdf'], 'maxSizeMB' => 2]]]);
        $user = $this->verifiedUser(['email' => 'upload@audit.test', 'password' => 'audit-password']);
        $payload = ['oprec_id' => $f['period']->id, 'schema_version' => '1', 'nim' => 'E318888',
            'tanggal_lahir' => '2004-01-01', 'nama' => 'Peserta Upload', 'angkatan' => '2024',
            'status_kepengurusan' => 'Anggota Baru', 'persetujuan_data_benar' => 'on', 'persetujuan_penggunaan_data' => 'on'];
        foreach ([1, 2, 3] as $rank) $payload["divisi_pilihan_$rank"] = (string) $f['divisions'][$rank - 1]->id;
        $payload['jabatan_pilihan_1'] = 'Sekretaris 2';
        // Laravel's fake file reports MIME from its filename. Use a real test
        // upload here so fileinfo must inspect the bytes despite the claimed MIME.
        $forged = UploadedFile::fake()->createWithContent('cv.pdf', '<?php echo "forged";');
        $this->actingAs($user, 'sanctum')->postJson('/api/user/oprec/register', $payload + [
            'cv' => new UploadedFile($forged->getPathname(), 'cv.pdf', 'application/pdf', UPLOAD_ERR_OK, true),
        ])->assertUnprocessable()->assertJsonValidationErrors('cv');
        $this->postJson('/api/user/oprec/register', $payload + [
            'cv' => UploadedFile::fake()->create('cv.pdf', 2049, 'application/pdf'),
        ])->assertUnprocessable()->assertJsonValidationErrors('cv');
        $pdf = fn () => UploadedFile::fake()->createWithContent('cv.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF");
        $this->postJson('/api/user/oprec/register', $payload + ['cv' => $pdf()])->assertCreated();
        $registration = $f['period']->registrations()->where('user_id', $user->id)->firstOrFail();
        $path = $registration->file_uploads['cv'];
        Storage::disk('local')->assertExists($path);
        $this->postJson('/api/user/oprec/register', $payload + ['cv' => $pdf()])->assertConflict();
        $this->assertSame([$path], Storage::disk('local')->allFiles("oprec/{$f['period']->id}"));
    }

    public function test_registration_accepts_20_mb_of_files_and_rejects_more(): void
    {
        $f = $this->fixture();
        $f['period']->update(['form_fields' => [...$f['period']->form_fields,
            ['name' => 'file_a', 'type' => 'file', 'accept' => ['.pdf'], 'maxSizeMB' => 8],
            ['name' => 'file_b', 'type' => 'file', 'accept' => ['.pdf'], 'maxSizeMB' => 8],
            ['name' => 'file_c', 'type' => 'file', 'accept' => ['.pdf'], 'maxSizeMB' => 8],
            ['name' => 'file_d', 'type' => 'file', 'accept' => ['.pdf'], 'maxSizeMB' => 10],
        ]]);
        $payload = ['oprec_id' => $f['period']->id, 'schema_version' => '1', 'nim' => 'E318889',
            'tanggal_lahir' => '2004-01-01', 'nama' => 'Peserta Upload', 'angkatan' => '2024',
            'status_kepengurusan' => 'Anggota Baru',
            'persetujuan_data_benar' => 'on', 'persetujuan_penggunaan_data' => 'on'];
        foreach ([1, 2, 3] as $rank) $payload["divisi_pilihan_$rank"] = (string) $f['divisions'][$rank - 1]->id;
        $payload['jabatan_pilihan_1'] = 'Sekretaris 2';
        $files = fn () => [
            'file_a' => UploadedFile::fake()->create('a.pdf', 8192, 'application/pdf'),
            'file_b' => UploadedFile::fake()->create('b.pdf', 8192, 'application/pdf'),
            'file_c' => UploadedFile::fake()->create('c.pdf', 4096, 'application/pdf'),
        ];

        $first = $this->verifiedUser(['email' => 'limit-ok@audit.test']);
        $this->actingAs($first, 'sanctum')->postJson('/api/user/oprec/register', $payload + $files())
            ->assertCreated();

        $second = $this->verifiedUser(['email' => 'limit-over@audit.test']);
        $this->actingAs($second, 'sanctum')->postJson('/api/user/oprec/register', array_replace($payload,
            ['nim' => 'E318890']) + $files() + [
            'file_d' => UploadedFile::fake()->createWithContent('d.pdf', "%PDF-1.4\n%%EOF"),
        ])->assertStatus(413)->assertJsonPath('message', 'Ukuran total berkas maksimal 20 MB.');
        $this->assertDatabaseMissing('oprec_registrations', ['user_id' => $second->id]);
        $this->postJson('/api/user/oprec/register', array_replace($payload, ['nim' => 'E318890']) + [
            'file_d' => UploadedFile::fake()->create('d.pdf', 8193, 'application/pdf'),
        ])->assertUnprocessable()->assertJsonValidationErrors('file_d');
    }

    public function test_admin_can_import_closed_period_registration_into_existing_account(): void
    {
        $f = $this->fixture();
        $f['period']->update(['status' => 'closed', 'tanggal_tutup' => now()->subMinute()]);
        $f['period']->update(['form_fields' => [...$f['period']->form_fields,
            ['name' => 'ktm_sim_online', 'label' => 'Foto KTM', 'type' => 'file', 'required' => true,
                'accept' => ['.pdf'], 'maxSizeMB' => 2]]]);
        $admin = $this->verifiedUser(['email' => 'import-admin@audit.test', 'password' => 'audit-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $participant = $this->verifiedUser(['email' => 'imported@audit.test', 'password' => 'audit-password']);
        $payload = [
            'email' => 'IMPORTED@AUDIT.TEST', 'schema_version' => '1', 'nim' => 'E316789',
            'tanggal_lahir' => '2005-02-03', 'nama' => 'Peserta Cadangan', 'angkatan' => '2024',
            'status_kepengurusan' => 'Anggota Baru', 'persetujuan_data_benar' => 'on',
            'persetujuan_penggunaan_data' => 'on',
        ];
        foreach ([1, 2, 3] as $rank) {
            $payload["divisi_pilihan_{$rank}"] = (string) $f['divisions'][$rank - 1]->id;
        }
        $payload['jabatan_pilihan_1'] = 'Wakil Ketua Umum';
        $url = "/api/admin/oprec/{$f['period']->id}/registrants";
        $lookup = $url.'/account';

        $this->actingAs($f['leader'], 'sanctum')->postJson($url, $payload)->assertForbidden();
        $this->getJson($lookup.'?email=imported%40audit.test')->assertForbidden();
        $this->getJson($lookup.'?q=imported')->assertForbidden();
        $this->actingAs($admin, 'sanctum')->postJson($url, array_replace($payload, ['email' => 'missing@audit.test']))
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->getJson($lookup.'?email=missing%40audit.test')->assertOk()->assertJsonPath('data.exists', false);
        $this->getJson($lookup.'?email=IMPORTED%40AUDIT.TEST')->assertOk()->assertJsonPath('data.exists', true)->assertJsonPath('data.alreadyRegistered', false);
        $this->getJson($lookup.'?q=imported')->assertOk()->assertJsonFragment(['email' => 'imported@audit.test']);
        $this->getJson($lookup.'?q=%25%5F')->assertOk()->assertJsonPath('data.matches', []);
        $this->postJson($url, array_replace($payload, ['tanggal_lahir' => '']))
            ->assertUnprocessable()->assertJsonValidationErrors('tanggal_lahir');
        $this->postJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('ktm_sim_online');
        $pdf = UploadedFile::fake()->createWithContent('ktm.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF");
        $this->postJson($url, $payload + ['ktm_sim_online' => $pdf])->assertCreated()->assertJsonPath('data.submitted', true);
        $this->assertDatabaseHas('oprec_registrations', ['oprec_id' => $f['period']->id, 'user_id' => $participant->id, 'nim' => 'E316789']);
        Storage::disk('local')->assertExists($f['period']->registrations()->where('user_id', $participant->id)->firstOrFail()->file_uploads['ktm_sim_online']);
        $this->postJson($url, $payload)->assertConflict();
        $this->getJson($lookup.'?email=imported%40audit.test')->assertOk()->assertJsonPath('data.alreadyRegistered', true);
        $this->getJson($lookup.'?q=imported')->assertOk()->assertJsonPath('data.matches.0.alreadyRegistered', true);
        $this->actingAs($participant, 'sanctum')->getJson("/api/user/oprec/workspace?oprec_id={$f['period']->id}")
            ->assertOk()->assertJsonPath('data.registration.nim', 'E316789');
    }

    public function test_oprec_rate_limit_is_per_account_and_cannot_be_bypassed_with_form_email(): void
    {
        $f = $this->fixture();
        $this->actingAs($f['owner'], 'sanctum');
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson('/api/user/oprec/enroll', ['oprec_id' => $f['period']->id])->assertOk();
        }
        $this->postJson('/api/user/oprec/enroll', ['oprec_id' => $f['period']->id, 'email' => 'different@audit.test'])->assertStatus(429);
        $other = $this->verifiedUser(['email' => 'same-proxy@audit.test', 'password' => 'audit-password']);
        $this->actingAs($other, 'sanctum')->postJson('/api/user/oprec/enroll', ['oprec_id' => $f['period']->id])->assertCreated();
    }

    public function test_user_must_log_in_before_opening_private_oprec_endpoints(): void
    {
        $f = $this->fixture();
        $this->getJson('/api/user/oprec/workspace')->assertUnauthorized();
        $this->getJson("/api/user/oprec/{$f['period']->id}/written-test")->assertUnauthorized();
        $this->postJson('/api/user/oprec/register', [])->assertUnauthorized();
        $this->postJson('/api/user/oprec/enroll', [])->assertUnauthorized();
        $this->postJson("/api/user/oprec/{$f['period']->id}/written-test", [])->assertUnauthorized();
        $this->withHeaders(['Origin' => 'http://localhost:3000', 'Referer' => 'http://localhost:3000/login'])
            ->postJson('/api/auth/login', ['email' => $f['owner']->email, 'password' => 'audit-password'])->assertOk()->assertJsonPath('data.role', 'user');
        $this->getJson('/api/user/oprec/workspace')->assertOk()->assertJsonPath('data.registration.nim', 'E312345');
    }

    public function test_announcement_lock_cannot_be_bypassed_by_bumping_the_registration_schema(): void
    {
        $f = $this->fixture();
        $fields = array_map(fn ($field) => [...$field, 'label' => $field['name']], $f['period']->form_fields);
        $f['period']->update(['status' => 'closed', 'pengumuman_published' => true, 'form_fields' => $fields]);
        $admin = $this->verifiedUser(['email' => 'schema-admin@audit.test', 'password' => 'audit-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $fields[0]['label'] = 'Nama kolom diubah';
        $payload = ['periode' => $f['period']->periode, 'status' => 'closed', 'schema_version' => '2', 'form_fields' => $fields, 'guidebook' => $f['period']->guidebook,
            'divisi_tersedia' => $f['divisions']->map(fn ($division) => $division->only(['nama', 'jabatan']))->all(),
            'pengumuman' => ['published' => true]];
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/oprec/{$f['period']->id}", $payload)
            ->assertUnprocessable()->assertJsonValidationErrors('form_fields');
        $this->assertSame('1', $f['period']->fresh()->schema_version);
    }
    public function test_closing_registration_ignores_json_object_key_order_but_keeps_schema_changes_locked(): void
    {
        $f = $this->fixture();
        $fields = array_map(fn ($field) => [...$field, 'label' => $field['name']], $f['period']->form_fields);
        $f['period']->update(['form_fields' => $fields]);
        $admin = $this->verifiedUser(['email' => 'schema-admin@audit.test', 'password' => 'audit-password']);
        $admin->forceFill(['role' => User::ROLE_ADMIN])->save();
        $payload = ['periode' => $f['period']->periode, 'status' => 'closed', 'schema_version' => '1', 'guidebook' => $f['period']->guidebook,
            'form_fields' => array_map(fn ($field) => array_reverse($field, true), $fields),
            'divisi_tersedia' => $f['divisions']->map(fn ($division) => $division->only(['nama', 'jabatan']))->all(),
            'faq' => [], 'pengumuman' => ['published' => false]];
        // Nested option objects have the same JSONB reordering behavior.
        $payload['form_fields'][3]['options'][0] = array_reverse($payload['form_fields'][3]['options'][0], true);
        $url = "/api/admin/oprec/{$f['period']->id}";
        $this->actingAs($admin, 'sanctum')->putJson($url, $payload)->assertOk();
        $this->assertSame('closed', $f['period']->fresh()->status);
        $changed = $payload;
        $changed['form_fields'][0]['label'] = 'Different question';
        $this->putJson($url, $changed)->assertUnprocessable()->assertJsonValidationErrors('schema_version');
        $f['period']->update(['pengumuman_published' => true]);
        $this->putJson($url, $payload)->assertOk();
        $reordered = $payload;
        $reordered['schema_version'] = '2';
        $reordered['form_fields'] = array_reverse($payload['form_fields']);
        $this->putJson($url, $reordered)->assertUnprocessable()->assertJsonValidationErrors('form_fields');
    }

}
