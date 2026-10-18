<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecDivision;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecRegistrantTableTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_private_file_is_marked_and_can_be_restored_by_admin(): void
    {
        Storage::fake('local');
        $oprec = Oprec::create(['periode' => 'Restore', 'status' => 'closed', 'schema_version' => '1',
            'form_fields' => [['name' => 'portfolio', 'type' => 'file', 'label' => 'Portofolio', 'accept' => ['.pdf'], 'maxSizeMB' => 2]]]);
        $candidate = $this->verifiedUser(['email' => 'restore-candidate@example.test', 'password' => 'password-testing-123']);
        $registration = OprecRegistration::create(['oprec_id' => $oprec->id, 'user_id' => $candidate->id,
            'nim' => 'E31999', 'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Peserta'],
            'file_uploads' => ['portfolio' => "oprec/{$oprec->id}/lost.pdf"]]);
        $url = "/api/admin/oprec/{$oprec->id}/registrants/{$registration->id}/files/portfolio";
        $leader = $this->verifiedUser(['email' => 'restore-leader@example.test', 'password' => 'password-testing-123']);
        $leader->forceFill(['role' => 'leader'])->save();
        $this->actingAs($leader, 'sanctum')->post($url, ['file' => UploadedFile::fake()->create('portfolio.pdf', 1, 'application/pdf')])
            ->assertForbidden();
        $admin = $this->verifiedUser(['email' => 'restore-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $this->actingAs($admin, 'sanctum')->getJson("/api/admin/oprec/{$oprec->id}/registrants")
            ->assertOk()->assertJsonPath('data.0.fileUploads.portfolio.available', false)
            ->assertJsonPath('data.0.fileUploads.portfolio.downloadUrl', null);
        $this->getJson($url)->assertNotFound();
        $this->post($url, ['file' => UploadedFile::fake()->createWithContent('bad.pdf', '<?php echo 1;')])
            ->assertUnprocessable();
        $this->assertDatabaseHas('oprec_registrations', ['id' => $registration->id]);
        $this->post($url, ['file' => UploadedFile::fake()->createWithContent('portfolio.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF")])
            ->assertOk()->assertJsonPath('data.available', true);
        $this->getJson("/api/admin/oprec/{$oprec->id}/registrants")
            ->assertOk()->assertJsonPath('data.0.fileUploads.portfolio.available', true);
        $this->assertStringContainsString('%PDF-1.4', $this->getJson($url)->assertOk()->streamedContent());
        $this->post($url, ['file' => UploadedFile::fake()->create('again.pdf', 1, 'application/pdf')])->assertStatus(409);
    }

    public function test_private_file_download_requires_session_and_returns_the_file_with_its_extension(): void
    {
        Storage::fake('local');
        $oprec = Oprec::create(['periode' => 'Download', 'status' => 'closed', 'schema_version' => '1',
            'form_fields' => [['name' => 'portfolio', 'type' => 'file', 'label' => 'Portofolio']]]);
        $candidate = $this->verifiedUser(['email' => 'download-candidate@example.test', 'password' => 'password-testing-123']);
        $path = "oprec/{$oprec->id}/portfolio.pdf";
        Storage::disk('local')->put($path, '%PDF-1.4 private portfolio');
        $registration = OprecRegistration::create(['oprec_id' => $oprec->id, 'user_id' => $candidate->id,
            'nim' => 'E311234', 'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Peserta'],
            'file_uploads' => ['portfolio' => $path]]);
        $url = "/api/admin/oprec/{$oprec->id}/registrants/{$registration->id}/files/portfolio";
        $this->get($url)->assertUnauthorized();
        $this->actingAs($candidate, 'sanctum')->getJson($url)->assertForbidden();
        $admin = $this->verifiedUser(['email' => 'download-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $this->actingAs($admin, 'sanctum')->getJson("/api/admin/oprec/{$oprec->id}/registrants")
            ->assertOk()->assertJsonPath('data.0.fileUploads.portfolio.fileName', "oprec-{$registration->id}-portfolio.pdf");
        $response = $this->getJson($url)->assertOk();
        $this->assertStringContainsString("oprec-{$registration->id}-portfolio.pdf", $response->headers->get('Content-Disposition'));
        $this->assertSame('%PDF-1.4 private portfolio', $response->streamedContent());
        $this->assertDatabaseHas('audit_entries', ['action' => 'oprec.download', 'actor_id' => $admin->id, 'http_status' => 200]);
    }

    public function test_excel_and_pdf_export_include_all_filtered_registrants_for_admin_and_leader(): void
    {
        $oprec = Oprec::create(['periode' => 'Export', 'status' => 'closed', 'schema_version' => '1',
            'form_fields' => [['name' => 'motivasi', 'type' => 'text', 'label' => 'Motivasi']]]);
        for ($i = 1; $i <= 21; $i++) {
            $user = $this->verifiedUser(['email' => "export{$i}@example.test", 'name' => "Peserta {$i}", 'password' => 'password-testing-123']);
            OprecRegistration::create(['oprec_id' => $oprec->id, 'user_id' => $user->id,
                'nim' => "E31{$i}", 'tanggal_lahir' => '2004-01-01', 'divisi_pilihan_1' => $i === 21 ? 8 : 7,
                'form_data' => ['nama' => "Peserta {$i}", 'motivasi' => "Jawaban {$i}"]]);
        }
        $base = "/api/admin/oprec/{$oprec->id}/registrants/export/";
        $this->getJson($base.'xlsx')->assertUnauthorized();
        $admin = $this->verifiedUser(['email' => 'export-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $xlsx = $this->actingAs($admin, 'sanctum')->getJson($base.'xlsx')->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')->getContent();
        $path = tempnam(sys_get_temp_dir(), 'oprec-test-');
        file_put_contents($path, $xlsx);
        $zip = new \ZipArchive();
        $this->assertTrue($zip->open($path) === true);
        $sheet = $zip->getFromName('xl/worksheets/sheet1.xml');
        $styles = $zip->getFromName('xl/styles.xml');
        $zip->close();
        unlink($path);
        $this->assertStringContainsString('Jawaban 21', $sheet);
        $this->assertSame(22, substr_count($sheet, '<row r='));
        $this->assertStringContainsString('<autoFilter ref="A1:K22"/>', $sheet);
        $this->assertStringContainsString('state="frozen"', $sheet);
        $this->assertStringContainsString('wrapText="1"', $styles);
        $this->assertStringContainsString('rgb="FF155EEF"', $styles);
        $xml = new \DOMDocument();
        $this->assertTrue($xml->loadXML($sheet));
        $this->assertTrue($xml->loadXML($styles));
        $allPdf = $this->getJson($base.'pdf')->assertOk()->getContent();
        $this->assertGreaterThan(2, substr_count($allPdf, '/Type /Page /Parent'));
        $this->assertStringContainsString('Jawaban 21', $allPdf);

        $leader = $this->verifiedUser(['email' => 'export-leader@example.test', 'password' => 'password-testing-123']);
        $leader->forceFill(['role' => 'leader'])->save();
        $pdf = $this->actingAs($leader, 'sanctum')->getJson($base.'pdf?division=8')->assertOk()
            ->assertHeader('Content-Type', 'application/pdf')->getContent();
        $this->assertStringStartsWith('%PDF-1.4', $pdf);
        $this->assertStringContainsString('/MediaBox [0 0 842 595]', $pdf);
        $this->assertStringContainsString('(Kolom) Tj', $pdf);
        $this->assertStringContainsString('(Jawaban) Tj', $pdf);
        $this->assertStringContainsString('Jawaban 21', $pdf);
        $this->assertStringNotContainsString('Jawaban 20', $pdf);
        $this->getJson($base.'xlsx?division=invalid')->assertUnprocessable();
    }

    public function test_admin_list_is_paginated_filterable_and_contains_form_answers_and_private_file_links(): void
    {
        Storage::fake('local');
        config()->set('admin.email', 'table-admin@example.test');
        $admin = $this->verifiedUser(['email' => 'table-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $oprec = Oprec::create(['periode' => 'Table', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => [
            ['name' => 'portfolio', 'type' => 'text', 'label' => 'Portofolio', 'target_type' => 'specific', 'target_divisions' => ['Kominfo']],
            ['name' => 'cv', 'type' => 'file', 'label' => 'CV'],
        ]]);
        Storage::disk('local')->put("oprec/{$oprec->id}/private.pdf", '%PDF-1.4 test');
        for ($i = 1; $i <= 21; $i++) {
            $user = $this->verifiedUser(['email' => "candidate{$i}@example.test", 'name' => "Peserta {$i}", 'password' => 'password-testing-123']);
            $registration = OprecRegistration::create([
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
            ->assertJsonPath('data.0.fileUploads.cv.downloadUrl', url("{$url}/{$registration->id}/files/cv"));
        $this->getJson("{$url}?search=E21")->assertOk()->assertJsonPath('total', 1);
        $this->getJson("{$url}?search=Nama Khusus Form")->assertOk()->assertJsonPath('total', 1);
        $this->getJson("{$url}?division=invalid")->assertUnprocessable();
    }

    public function test_admin_can_delete_only_a_registrant_from_the_selected_oprec_and_its_private_file(): void
    {
        Storage::fake('local');
        config()->set('admin.email', 'delete-registrant-admin@example.test');
        $admin = $this->verifiedUser(['email' => 'delete-registrant-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $candidate = $this->verifiedUser(['email' => 'delete-registrant-candidate@example.test', 'password' => 'password-testing-123']);
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
        $admin = $this->verifiedUser(['email' => 'edit-registrant-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $candidate = $this->verifiedUser(['email' => 'edit-registrant-candidate@example.test', 'password' => 'password-testing-123']);
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
            'portfolio' => 'https://example.test/portfolio', 'status_kepengurusan' => 'Anggota Baru',
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
