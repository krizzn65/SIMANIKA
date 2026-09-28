<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OprecPublicWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_hides_group_link_and_lowercase_nim_can_find_published_result(): void
    {
        $user = User::create(['email' => 'oprec-result@example.test', 'password' => 'password-testing-123']);
        $oprec = Oprec::create([
            'periode' => '2025/2026', 'status' => 'closed', 'schema_version' => '1',
            'form_fields' => [], 'link_grup_wa' => 'https://chat.whatsapp.com/private',
            'pengumuman_published' => true, 'pengumuman_tanggal' => now()->subMinute(),
        ]);
        OprecRegistration::create([
            'oprec_id' => $oprec->id, 'user_id' => $user->id, 'nim' => 'E312345',
            'tanggal_lahir' => '2004-01-01', 'status' => 'accepted', 'form_data' => [],
        ]);

        $this->getJson('/api/public/oprec')->assertOk()
            ->assertJsonPath('data.id', $oprec->id)
            ->assertJsonPath('data.linkGrupWa', null)
            ->assertDontSee('chat.whatsapp.com/private');
        $this->postJson("/api/public/oprec/{$oprec->id}/result", [
            'nim' => ' e312345 ', 'tanggal_lahir' => '2004-01-01',
        ])->assertOk()->assertJsonPath('data.status', 'accepted');
    }

    public function test_workspace_uses_public_period_and_historical_access_is_owner_only(): void
    {
        $owner = User::create(['email' => 'oprec-owner@example.test', 'password' => 'password-testing-123']);
        $stranger = User::create(['email' => 'oprec-stranger@example.test', 'password' => 'password-testing-123']);
        $old = Oprec::create(['periode' => '2024/2025', 'status' => 'closed', 'schema_version' => '1', 'form_fields' => []]);
        $current = Oprec::create(['periode' => '2025/2026', 'status' => 'open', 'schema_version' => '1', 'form_fields' => []]);
        Oprec::create(['periode' => '2026/2027', 'status' => 'draft', 'schema_version' => '1', 'form_fields' => []]);
        OprecRegistration::create([
            'oprec_id' => $old->id, 'user_id' => $owner->id, 'nim' => 'E312345',
            'tanggal_lahir' => '2004-01-01', 'form_data' => [],
        ]);

        $this->actingAs($owner, 'sanctum')->getJson('/api/user/oprec/workspace')
            ->assertOk()->assertJsonPath('data.oprec.id', $current->id);
        $this->getJson("/api/user/oprec/workspace?oprec_id={$old->id}")
            ->assertOk()->assertJsonPath('data.oprec.id', $old->id);
        $this->actingAs($stranger, 'sanctum')->getJson("/api/user/oprec/workspace?oprec_id={$old->id}")
            ->assertNotFound();
    }

    public function test_scheduled_announcement_message_is_not_sent_to_public_before_release(): void
    {
        $oprec = Oprec::create([
            'periode' => 'Scheduled', 'status' => 'closed', 'schema_version' => '1',
            'form_fields' => [], 'pengumuman_published' => true,
            'pengumuman_tanggal' => now()->addDay(), 'pengumuman_pesan' => 'Rahasia hasil seleksi',
        ]);
        $this->getJson('/api/public/oprec')->assertOk()
            ->assertJsonPath('data.id', $oprec->id)
            ->assertJsonPath('data.pengumuman.pesan', '')
            ->assertDontSee('Rahasia hasil seleksi');

        $oprec->update([
            'status' => 'open',
            'tanggal_tutup' => now()->addDay(),
            'pengumuman_tanggal' => now()->subMinute(),
        ]);
        $this->getJson('/api/public/oprec')->assertOk()
            ->assertJsonPath('data.pengumuman.pesan', '')
            ->assertDontSee('Rahasia hasil seleksi');
    }

    public function test_enrollment_requires_current_open_period_and_three_divisions(): void
    {
        $user = User::create(['email' => 'oprec-enroll@example.test', 'password' => 'password-testing-123']);
        $old = Oprec::create([
            'periode' => '2024/2025', 'status' => 'open', 'schema_version' => '1', 'form_fields' => [],
            'tanggal_buka' => now()->subDay(), 'tanggal_tutup' => now()->addDay(),
        ]);
        $current = Oprec::create([
            'periode' => '2025/2026', 'status' => 'open', 'schema_version' => '1', 'form_fields' => [],
            'tanggal_buka' => now()->subDay(), 'tanggal_tutup' => now()->addDay(),
        ]);
        foreach (['BPH', 'Humas', 'Kominfo'] as $index => $name) {
            $old->divisions()->create(['nama' => $name, 'sort_order' => $index]);
            $current->divisions()->create(['nama' => $name, 'sort_order' => $index]);
        }

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/user/oprec/enroll', ['oprec_id' => $old->id])->assertNotFound();
        $this->postJson('/api/user/oprec/register', [
            'oprec_id' => $old->id, 'schema_version' => '1',
        ])->assertStatus(409);
        $this->postJson('/api/user/oprec/enroll', ['oprec_id' => $current->id])->assertCreated();
        $this->getJson('/api/user/dashboard')->assertOk()
            ->assertJsonFragment(['href' => "/dashboard/oprec?oprec_id={$current->id}", 'status' => 'incomplete']);
        $current->update(['tanggal_tutup' => now()->subMinute()]);
        $this->postJson('/api/user/oprec/enroll', ['oprec_id' => $current->id])->assertStatus(409);
        $this->getJson('/api/user/dashboard')->assertOk()
            ->assertJsonMissing(['href' => "/dashboard/oprec?oprec_id={$current->id}", 'status' => 'incomplete']);
    }
}
