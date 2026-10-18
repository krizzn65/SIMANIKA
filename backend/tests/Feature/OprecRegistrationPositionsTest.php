<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecDivision;
use App\Models\User;
use App\Services\OprecRegistrationPositionCorrection;
use App\Services\OprecSimulationCleanup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class OprecRegistrationPositionsTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        Storage::fake('local');
        $admin = $this->verifiedUser(['email' => 'positions-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $user = $this->verifiedUser(['email' => 'positions-user@example.test', 'password' => 'password-testing-123']);
        $period = Oprec::create(['periode' => '2026/2027', 'status' => 'open', 'schema_version' => '1',
            'tanggal_buka' => now()->subHour(), 'tanggal_tutup' => now()->addHour(), 'form_fields' => [
                ['name' => 'nama', 'type' => 'text', 'label' => 'Nama', 'required' => true],
                ['name' => 'nim', 'type' => 'text', 'label' => 'NIM', 'required' => true],
                ['name' => 'tanggal_lahir', 'type' => 'date', 'label' => 'Tanggal lahir', 'required' => true],
                ['name' => 'angkatan', 'type' => 'select', 'label' => 'Angkatan', 'required' => true, 'options' => [['value' => '2024', 'label' => '2024']]],
            ]]);
        $divisions = collect(['BPH', 'Humas', 'PSDM'])->map(fn ($name) => $period->divisions()->create([
            'nama' => $name, 'jabatan' => \App\Services\OprecAssessmentService::positions($name),
        ]));
        $payload = ['oprec_id' => $period->id, 'schema_version' => '1', 'nama' => 'Peserta Posisi', 'nim' => 'E3124001',
            'tanggal_lahir' => '2004-01-01', 'angkatan' => '2024', 'status_kepengurusan' => 'Anggota Baru',
            'persetujuan_data_benar' => 'on', 'persetujuan_penggunaan_data' => 'on', 'jabatan_pilihan_1' => 'Sekretaris 2',
            'divisi_pilihan_1' => (string) $divisions[0]->id, 'divisi_pilihan_2' => (string) $divisions[1]->id, 'divisi_pilihan_3' => (string) $divisions[2]->id];
        return compact('admin', 'user', 'period', 'divisions', 'payload');
    }

    public function test_public_and_admin_catalogs_ignore_legacy_officer_positions(): void
    {
        $f = $this->fixture();
        $expected = [['Wakil Ketua Umum', 'Sekretaris 2', 'Bendahara 2'], ['Staff Divisi Humas'], ['Staff Divisi PSDM']];
        foreach (['/api/public/oprec', "/api/admin/oprec/{$f['period']->id}"] as $url) {
            if (str_contains($url, '/admin/')) $this->actingAs($f['admin'], 'sanctum');
            $response = $this->getJson($url)->assertOk();
            foreach ($expected as $index => $positions) $response->assertJsonPath("data.divisiTersedia.{$index}.jabatan", $positions);
        }
    }

    public function test_participant_requires_a_valid_bph_choice_and_cannot_submit_officer_or_specialist_positions(): void
    {
        $f = $this->fixture(); $this->actingAs($f['user'], 'sanctum');
        foreach ([null, 'Ketua Umum', 'Sekretaris 1', 'Bendahara 1'] as $position) {
            $this->postJson('/api/user/oprec/register', [...$f['payload'], 'jabatan_pilihan_1' => $position])
                ->assertUnprocessable()->assertJsonValidationErrors('jabatan_pilihan_1');
        }
        foreach (['Ketua Divisi Humas', 'Staff Bidang Internal'] as $position) {
            $this->postJson('/api/user/oprec/register', [...$f['payload'], 'jabatan_pilihan_2' => $position])
                ->assertUnprocessable()->assertJsonValidationErrors('jabatan_pilihan_2');
        }
        $this->assertDatabaseCount('oprec_registrations', 0);
        foreach (OprecDivision::defaultJabatan('BPH') as $index => $position) {
            $user = $this->verifiedUser(['email' => "valid-position-{$index}@example.test", 'password' => 'password-testing-123']);
            $this->actingAs($user, 'sanctum')->postJson('/api/user/oprec/register', [...$f['payload'],
                'nim' => 'E312410'.$index, 'jabatan_pilihan_1' => $position])->assertCreated();
            $form = $f['period']->registrations()->where('user_id', $user->id)->firstOrFail()->form_data;
            $this->assertSame($position, $form['jabatan_pilihan_1']);
            $this->assertSame('Staff Divisi Humas', $form['jabatan_pilihan_2']);
            $this->assertSame('Staff Divisi PSDM', $form['jabatan_pilihan_3']);
        }
    }

    public function test_admin_cannot_customize_registration_catalog_but_omitted_catalog_uses_defaults(): void
    {
        $f = $this->fixture(); $this->actingAs($f['admin'], 'sanctum');
        $payload = ['periode' => '2027/2028', 'status' => 'draft', 'schema_version' => '1',
            'form_fields' => $f['period']->form_fields, 'divisi_tersedia' => [['nama' => 'BPH'], ['nama' => 'Humas']],
            'pengumuman' => ['published' => false]];
        foreach ([['nama' => 'BPH', 'jabatan' => ['Ketua Umum']], ['nama' => 'Humas', 'jabatan' => ['Staff Bidang Internal']]] as $division) {
            $this->postJson('/api/admin/oprec', [...$payload, 'divisi_tersedia' => [$division]])->assertUnprocessable()->assertJsonValidationErrors('divisi_tersedia.0.jabatan');
        }
        $this->postJson('/api/admin/oprec', [...$payload, 'divisi_tersedia' => 'invalid'])->assertUnprocessable();
        $this->postJson('/api/admin/oprec', $payload)->assertCreated()
            ->assertJsonPath('data.divisiTersedia.0.jabatan', OprecDivision::defaultJabatan('BPH'))
            ->assertJsonPath('data.divisiTersedia.1.jabatan', ['Staff Divisi Humas']);
    }

    public function test_admin_form_correction_obeys_the_same_registration_rules(): void
    {
        $f = $this->fixture();
        $registration = $f['period']->registrations()->create(['user_id' => $f['user']->id, 'nim' => $f['payload']['nim'],
            'tanggal_lahir' => $f['payload']['tanggal_lahir'], 'form_data' => ['nama' => 'Peserta Posisi'],
            'divisi_pilihan_1' => $f['divisions'][0]->id, 'divisi_pilihan_2' => $f['divisions'][1]->id, 'divisi_pilihan_3' => $f['divisions'][2]->id]);
        $url = "/api/admin/oprec/{$f['period']->id}/registrants/{$registration->id}/form";
        $this->actingAs($f['admin'], 'sanctum')->putJson($url, [...$f['payload'], 'jabatan_pilihan_1' => 'Ketua Umum'])->assertUnprocessable();
        $this->putJson($url, $f['payload'])->assertOk();
        $this->assertSame('Staff Divisi Humas', $registration->fresh()->form_data['jabatan_pilihan_2']);
    }

    public function test_legacy_correction_is_scoped_encrypted_repeatable_and_preserves_published_decisions(): void
    {
        $f = $this->fixture();
        $f['period']->update(['status' => 'closed', 'pengumuman_published' => true, 'pengumuman_tanggal' => now()->subMinute()]);
        $unrelated = Oprec::create(['periode' => '2028/2029']);
        $otherDivision = $unrelated->divisions()->create(['nama' => 'Humas', 'jabatan' => ['Ketua Divisi Humas']]);
        $ids = [];
        foreach (['Ketua Umum', 'Sekretaris 1', 'Bendahara 1'] as $index => $position) {
            $ids[] = $f['period']->registrations()->create(['user_id' => $index === 0 ? $f['user']->id : $this->verifiedUser(['email' => "legacy-{$index}@example.test", 'password' => 'password-testing-123'])->id,
                'nim' => 'E312420'.$index, 'tanggal_lahir' => '2004-01-01',
                'form_data' => ['nama' => 'Historis', 'motivasi' => 'Jawaban tetap.', 'jabatan_pilihan_1' => $position,
                    'jabatan_pilihan_2' => 'Ketua Divisi Humas', 'jabatan_pilihan_3' => 'Staff Bidang Akademik'],
                'divisi_pilihan_1' => $f['divisions'][0]->id, 'divisi_pilihan_2' => $f['divisions'][1]->id, 'divisi_pilihan_3' => $f['divisions'][2]->id,
                'status' => 'accepted', 'accepted_division_id' => $f['divisions'][0]->id, 'accepted_position' => $position])->id;
        }
        $outsideCatalog = DB::table('oprec_divisions')->where('id', $otherDivision->id)->value('jabatan');
        $beforeDecision = DB::table('oprec_registrations')->get(['id', 'status', 'accepted_division_id', 'accepted_position', 'created_at'])->toJson();
        $service = app(OprecRegistrationPositionCorrection::class);
        $this->artisan('oprec:normalize-registration-positions', ['period' => $f['period']->id, '--dry-run' => true])->assertSuccessful();
        $this->assertSame('Ketua Umum', $f['period']->registrations()->findOrFail($ids[0])->form_data['jabatan_pilihan_1']);
        $this->assertSame([], Storage::disk('local')->allFiles());
        $report = $service->correct($f['period']->id);
        $this->assertSame(3, $report['registrations_changed']); $this->assertSame(9, $report['choices_changed']);
        $audit = json_decode(Crypt::decryptString(Storage::disk('local')->get($report['audit_file'])), true, 512, JSON_THROW_ON_ERROR);
        $this->assertSame('Ketua Umum', $audit['registrations'][0]['before']['jabatan_pilihan_1']);
        foreach (['Wakil Ketua Umum', 'Sekretaris 2', 'Bendahara 2'] as $index => $position) {
            $form = $f['period']->registrations()->findOrFail($ids[$index])->form_data;
            $this->assertSame($position, $form['jabatan_pilihan_1']);
            $this->assertSame('Staff Divisi Humas', $form['jabatan_pilihan_2']);
            $this->assertSame('Staff Divisi PSDM', $form['jabatan_pilihan_3']);
            $this->assertSame('Jawaban tetap.', $form['motivasi']);
        }
        $this->assertSame($beforeDecision, DB::table('oprec_registrations')->get(['id', 'status', 'accepted_division_id', 'accepted_position', 'created_at'])->toJson());
        $this->assertSame($outsideCatalog, DB::table('oprec_divisions')->where('id', $otherDivision->id)->value('jabatan'));
        $this->artisan('oprec:normalize-registration-positions', ['period' => $f['period']->id])->assertSuccessful();
        $this->assertSame(0, $service->correct($f['period']->id)['choices_changed']);
        $this->assertCount(1, Storage::disk('local')->allFiles());
        $cleanup = app(OprecSimulationCleanup::class);
        $cleanup->purge([$f['period']->id], [], $cleanup->inventory([$f['period']->id]));
        Storage::disk('local')->assertMissing($report['audit_file']);
    }

    public function test_unmappable_bph_choice_aborts_without_partial_updates_or_backup(): void
    {
        $f = $this->fixture();
        $f['period']->registrations()->create(['user_id' => $f['user']->id, 'nim' => 'E3124999', 'tanggal_lahir' => '2004-01-01',
            'form_data' => ['jabatan_pilihan_1' => 'Posisi tidak dikenal'], 'divisi_pilihan_1' => $f['divisions'][0]->id]);
        $before = DB::table('oprec_divisions')->get()->toJson();
        try { app(OprecRegistrationPositionCorrection::class)->correct($f['period']->id); $this->fail('Koreksi harus dibatalkan.'); }
        catch (RuntimeException $error) { $this->assertStringContainsString('tidak dapat dipetakan', $error->getMessage()); }
        $this->assertSame($before, DB::table('oprec_divisions')->get()->toJson());
        $this->assertSame([], Storage::disk('local')->allFiles());
    }
}
