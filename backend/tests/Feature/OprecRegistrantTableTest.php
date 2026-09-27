<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
