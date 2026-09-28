<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecDivision;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecRegistrantTableTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_list_is_paginated_filterable_and_contains_form_answers_and_private_file_links(): void
    {
        config()->set('admin.email', 'table-admin@example.test');
        $admin = User::create(['email' => 'table-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $oprec = Oprec::create(['periode' => 'Table', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => [
            ['name' => 'portfolio', 'type' => 'text', 'label' => 'Portofolio', 'target_type' => 'specific', 'target_divisions' => ['Kominfo']],
            ['name' => 'cv', 'type' => 'file', 'label' => 'CV'],
        ]]);
        for ($i = 1; $i <= 21; $i++) {
            $user = User::create(['email' => "candidate{$i}@example.test", 'name' => "Peserta {$i}", 'password' => 'password-testing-123']);
            OprecRegistration::create([
                'oprec_id' => $oprec->id, 'user_id' => $user->id, 'nim' => "E{$i}",
                'tanggal_lahir' => '2004-01-01', 'divisi_pilihan_1' => $i === 21 ? 8 : 7,
                'form_data' => ['nama' => $i === 21 ? 'Nama Khusus Form' : "Peserta {$i}", 'angkatan' => '2023', 'portfolio' => "Jawaban {$i}"],
                'file_uploads' => $i === 21 ? ['cv' => "oprec/{$oprec->id}/private.pdf"] : [],
            ]);
        }

        $url = "/api/admin/oprec/{$oprec->id}/registrants";
        $this->getJson($url)->assertUnauthorized();
        $this->actingAs($admin, 'sanctum')->getJson($url)->assertOk()->assertJsonPath('total', 21)->assertJsonCount(20, 'data');
        $this->getJson("{$url}?page=2")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("{$url}?division=8")->assertOk()->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.formData.portfolio', 'Jawaban 21')
            ->assertJsonPath('data.0.formData.angkatan', '2023')
            ->assertJsonPath('data.0.tanggalLahir', '2004-01-01')
            ->assertJsonPath('data.0.fileUploads.cv.downloadUrl', url("{$url}/21/files/cv"));
        $this->getJson("{$url}?search=E21")->assertOk()->assertJsonPath('total', 1);
        $this->getJson("{$url}?search=Nama Khusus Form")->assertOk()->assertJsonPath('total', 1);
        $this->getJson("{$url}?division=invalid")->assertUnprocessable();
    }

    public function test_admin_can_delete_only_a_registrant_from_the_selected_oprec_and_its_private_file(): void
    {
        Storage::fake('local');
        config()->set('admin.email', 'delete-registrant-admin@example.test');
        $admin = User::create(['email' => 'delete-registrant-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $candidate = User::create(['email' => 'delete-registrant-candidate@example.test', 'password' => 'password-testing-123']);
        $oprec = Oprec::create(['periode' => 'Delete A', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => []]);
        $otherOprec = Oprec::create(['periode' => 'Delete B', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => []]);
        $path = "oprec/{$oprec->id}/candidate.pdf";
        Storage::disk('local')->put($path, 'private candidate document');
        $registration = OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $candidate->id, 'nim' => 'E312345', 'tanggal_lahir' => '2004-01-01',
            'form_data' => ['nama' => 'Kandidat'], 'file_uploads' => ['cv' => $path],
        ]);

        $base = "/api/admin/oprec/{$oprec->id}/registrants/{$registration->id}";
        $this->actingAs($admin, 'sanctum')->deleteJson("/api/admin/oprec/{$otherOprec->id}/registrants/{$registration->id}")->assertNotFound();
        $this->deleteJson($base)->assertNoContent();
        $this->assertDatabaseMissing('oprec_registrations', ['id' => $registration->id]);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_admin_can_edit_valid_form_values_but_cannot_bypass_oprec_choices_or_nim_rules(): void
    {
        config()->set('admin.email', 'edit-registrant-admin@example.test');
        $admin = User::create(['email' => 'edit-registrant-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $candidate = User::create(['email' => 'edit-registrant-candidate@example.test', 'password' => 'password-testing-123']);
        $oprec = Oprec::create(['periode' => 'Edit', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => [
            ['name' => 'nama', 'type' => 'text', 'label' => 'Nama', 'required' => true],
            ['name' => 'nim', 'type' => 'text', 'label' => 'NIM', 'required' => true],
            ['name' => 'tanggal_lahir', 'type' => 'date', 'label' => 'Tanggal lahir', 'required' => true],
            ['name' => 'angkatan', 'type' => 'text', 'label' => 'Angkatan', 'required' => true],
            ['name' => 'portfolio', 'type' => 'url', 'label' => 'Portofolio', 'required' => false],
        ]]);
        $divisions = collect(['BPH', 'Humas', 'Kominfo'])->map(fn ($nama, $index) => OprecDivision::create([
            'oprec_id' => $oprec->id, 'nama' => $nama, 'sort_order' => $index,
        ]));
        $registration = OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $candidate->id, 'nim' => 'E3120000', 'tanggal_lahir' => '2004-01-01',
            'form_data' => ['nama' => 'Nama Lama', 'nim' => 'E3120000', 'tanggal_lahir' => '2004-01-01', 'angkatan' => '2023'],
            'divisi_pilihan_1' => $divisions[0]->id, 'divisi_pilihan_2' => $divisions[1]->id, 'divisi_pilihan_3' => $divisions[2]->id,
        ]);
        $url = "/api/admin/oprec/{$oprec->id}/registrants/{$registration->id}/form";
        $payload = [
            'schema_version' => '1',
            'nama' => 'Nama Baru', 'nim' => 'e3121111', 'tanggal_lahir' => '2004-02-02', 'angkatan' => '2024',
            'portfolio' => 'https://example.test/portfolio',
            'divisi_pilihan_1' => (string) $divisions[2]->id, 'divisi_pilihan_2' => (string) $divisions[1]->id, 'divisi_pilihan_3' => (string) $divisions[0]->id,
            'jabatan_pilihan_1' => 'Staff Divisi Kominfo', 'jabatan_pilihan_2' => 'Staff Divisi Humas', 'jabatan_pilihan_3' => 'Wakil Ketua Umum',
        ];

        $this->actingAs($admin, 'sanctum')->putJson($url, $payload)->assertOk()
            ->assertJsonPath('data.nim', 'E3121111')
            ->assertJsonPath('data.formData.nama', 'Nama Baru');
        $this->assertDatabaseHas('oprec_registrations', ['id' => $registration->id, 'nim' => 'E3121111']);
        $this->putJson($url, [...$payload, 'nim' => 'A123'])->assertUnprocessable();
        $this->putJson($url, [...$payload, 'divisi_pilihan_3' => (string) $divisions[1]->id])->assertUnprocessable();
        $this->putJson($url, [...$payload, 'schema_version' => 'old'])->assertStatus(409);
    }
}
