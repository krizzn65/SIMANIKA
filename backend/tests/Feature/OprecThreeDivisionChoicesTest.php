<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OprecThreeDivisionChoicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_three_distinct_divisions_and_persists_their_order(): void
    {
        $user = User::create(['email' => 'three-divisions@example.test', 'password' => 'password-testing-123']);
        $oprec = Oprec::create([
            'periode' => '2026/2027', 'status' => 'open', 'schema_version' => '1',
            'tanggal_buka' => now()->subDay(), 'tanggal_tutup' => now()->addDay(),
            'form_fields' => [
                ['name' => 'nim', 'label' => 'NIM', 'type' => 'text', 'required' => true],
                ['name' => 'tanggal_lahir', 'label' => 'Tanggal lahir', 'type' => 'date', 'required' => true],
                ['name' => 'divisi_pilihan_1', 'label' => 'Divisi pilihan', 'type' => 'select', 'required' => true],
            ],
        ]);
        $ids = collect(['BPH', 'Humas', 'PSDM'])->map(fn ($name, $index) => $oprec->divisions()->create(['nama' => $name, 'sort_order' => $index])->id)->all();
        $url = '/api/user/oprec/register';
        $base = ['oprec_id' => $oprec->id, 'schema_version' => '1', 'nim' => 'E12345', 'tanggal_lahir' => '2004-01-01'];

        $this->actingAs($user, 'sanctum')->postJson($url, $base + ['divisi_pilihan_1' => (string) $ids[0]])->assertUnprocessable();
        $this->postJson($url, $base + ['divisi_pilihan_1' => (string) $ids[0], 'divisi_pilihan_2' => (string) $ids[1], 'divisi_pilihan_3' => (string) $ids[1]])->assertUnprocessable();
        $this->postJson($url, $base + ['divisi_pilihan_1' => (string) $ids[0], 'divisi_pilihan_2' => (string) $ids[1], 'divisi_pilihan_3' => '99999'])->assertUnprocessable();
        $this->assertDatabaseCount('oprec_registrations', 0);

        $this->postJson($url, $base + ['divisi_pilihan_1' => (string) $ids[0], 'divisi_pilihan_2' => (string) $ids[1], 'divisi_pilihan_3' => (string) $ids[2]])->assertCreated();
        $this->assertDatabaseHas('oprec_registrations', ['oprec_id' => $oprec->id, 'divisi_pilihan_1' => $ids[0], 'divisi_pilihan_2' => $ids[1], 'divisi_pilihan_3' => $ids[2]]);
        $this->postJson($url, $base + ['divisi_pilihan_1' => (string) $ids[0], 'divisi_pilihan_2' => (string) $ids[1], 'divisi_pilihan_3' => (string) $ids[2]])->assertStatus(409);
    }
}
