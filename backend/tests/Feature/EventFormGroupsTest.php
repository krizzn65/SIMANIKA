<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EventFormGroupsTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $name): User
    {
        return User::create(['name' => $name, 'email' => "$name@example.test", 'password' => 'password-testing-123']);
    }

    private function event(): Event
    {
        return Event::create([
            'slug' => 'grouped-event', 'judul' => 'Grouped Event', 'kategori' => 'hi-fest',
            'tanggal_mulai' => today()->addDays(5), 'tanggal_selesai' => today()->addDays(6),
            'buka_pendaftaran' => today()->subDay(), 'deadline_pendaftaran' => today()->addDays(4),
            'status' => 'published', 'tipe_pendaftaran' => 'tim', 'kode_prefix' => 'TEST',
            'min_anggota' => 2, 'max_anggota' => 3,
        ]);
    }

    public function test_admin_can_save_group_rules_but_cannot_change_them_after_a_team_registers(): void
    {
        config()->set('admin.email', 'official@example.test');
        $admin = User::create(['name' => 'Official', 'email' => 'official@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $event = $this->event();
        $event->update(['status' => 'draft']);
        $payload = ['form_groups' => [
            ['title' => 'Data administrasi', 'scope' => 'personal', 'edit_role' => 'all', 'fields' => [
                ['name' => 'nama', 'label' => 'Nama', 'type' => 'text', 'required' => true],
            ]],
            ['title' => 'Berkas tim', 'scope' => 'team', 'edit_role' => 'leader', 'fields' => [
                ['name' => 'proposal', 'label' => 'Proposal', 'type' => 'file', 'required' => true],
            ]],
        ]];
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/events/{$event->id}/form", $payload)
            ->assertOk()->assertJsonPath('data.formGroups.0.scope', 'personal')
            ->assertJsonPath('data.formGroups.1.editRole', 'leader');
        $this->assertDatabaseCount('event_form_groups', 2);
        $this->assertDatabaseCount('event_form_fields', 2);
        $this->postJson("/api/admin/events/{$event->id}/publish")->assertOk();
        $leader = $this->user('leader');
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Builders'])->assertCreated();
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/events/{$event->id}/form", $payload)->assertUnprocessable();
        $this->assertDatabaseCount('event_form_groups', 2);
    }

    public function test_personal_answers_are_isolated_and_team_answers_follow_edit_role(): void
    {
        $event = $this->event();
        $personal = $event->formGroups()->create(['title' => 'Data administrasi', 'scope' => 'personal', 'edit_role' => 'all']);
        $personal->fields()->create(['event_id' => $event->id, 'name' => 'nama', 'label' => 'Nama', 'type' => 'text', 'required' => true]);
        $shared = $event->formGroups()->create(['title' => 'Penyisihan', 'scope' => 'team', 'edit_role' => 'leader', 'sort_order' => 1]);
        $shared->fields()->create(['event_id' => $event->id, 'name' => 'proposal', 'label' => 'Proposal', 'type' => 'text', 'required' => true]);
        $leader = $this->user('leader'); $member = $this->user('member'); $pending = $this->user('pending');
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Builders'])->assertCreated();
        $team = $event->teams()->firstOrFail();
        $this->actingAs($member, 'sanctum')->postJson("/api/user/events/{$event->id}/join-team", ['kode_unik' => $team->kode_unik])->assertOk();
        $this->actingAs($pending, 'sanctum')->postJson("/api/user/events/{$event->id}/join-team", ['kode_unik' => $team->kode_unik])->assertOk();
        $this->postJson("/api/user/events/{$event->id}/groups/{$personal->id}/submit", ['nama' => 'Pending'])->assertForbidden();
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/teams/{$team->id}/members/{$member->id}", ['action' => 'accept'])->assertOk();
        $this->postJson("/api/user/events/{$event->id}/groups/{$personal->id}/submit", ['nama' => 'Leader Secret'])->assertOk();
        $this->postJson("/api/user/events/{$event->id}/groups/{$shared->id}/submit", ['proposal' => 'Team Proposal'])->assertOk();
        $this->actingAs($member, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertOk()->assertJsonPath('data.event.formGroups.0.submitted', false)
            ->assertJsonPath('data.event.formGroups.1.fields.0.value', 'Team Proposal')
            ->assertJsonPath('data.event.formGroups.1.canEdit', false)->assertDontSee('Leader Secret');
        $this->postJson("/api/user/events/{$event->id}/groups/{$shared->id}/submit", ['proposal' => 'Hijacked'])->assertForbidden();
        $this->postJson("/api/user/events/{$event->id}/groups/{$personal->id}/submit", ['nama' => 'Member Private'])->assertOk();
        $this->getJson("/api/user/events/{$event->id}/workspace")
            ->assertJsonPath('data.event.formGroups.0.fields.0.value', 'Member Private')->assertDontSee('Leader Secret');
        $this->actingAs($leader, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertJsonPath('data.event.formGroups.0.fields.0.value', 'Leader Secret')->assertDontSee('Member Private');
        $this->assertDatabaseCount('event_group_submissions', 3);
    }

    public function test_shared_group_can_be_edited_by_members_when_admin_allows_it(): void
    {
        $event = $this->event();
        $group = $event->formGroups()->create(['title' => 'Berkas tim', 'scope' => 'team', 'edit_role' => 'all']);
        $group->fields()->create(['event_id' => $event->id, 'name' => 'tautan', 'label' => 'Tautan', 'type' => 'text', 'required' => true]);
        $leader = $this->user('leader'); $member = $this->user('member');
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Builders'])->assertCreated();
        $team = $event->teams()->firstOrFail();
        $this->actingAs($member, 'sanctum')->postJson("/api/user/events/{$event->id}/join-team", ['kode_unik' => $team->kode_unik])->assertOk();
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/teams/{$team->id}/members/{$member->id}", ['action' => 'accept'])->assertOk();
        $this->actingAs($member, 'sanctum')->postJson("/api/user/events/{$event->id}/groups/{$group->id}/submit", ['tautan' => 'Pertama'])->assertOk();
        $this->actingAs($leader, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertJsonPath('data.event.formGroups.0.fields.0.value', 'Pertama');
        $this->postJson("/api/user/events/{$event->id}/groups/{$group->id}/submit", ['tautan' => 'Revisi'])->assertOk();
        $this->actingAs($member, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertJsonPath('data.event.formGroups.0.fields.0.value', 'Revisi');
        $this->assertDatabaseCount('event_group_submissions', 1);
    }

    public function test_group_file_is_private_to_its_owner_and_can_be_kept_on_edit(): void
    {
        Storage::fake('local');
        $event = $this->event();
        $group = $event->formGroups()->create(['title' => 'Identitas', 'scope' => 'personal', 'edit_role' => 'all']);
        $group->fields()->create(['event_id' => $event->id, 'name' => 'proof', 'label' => 'Bukti', 'type' => 'file', 'required' => true]);
        $leader = $this->user('leader'); $member = $this->user('member');
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Builders'])->assertCreated();
        $team = $event->teams()->firstOrFail();
        $this->postJson("/api/user/events/{$event->id}/groups/{$group->id}/submit", [])->assertUnprocessable();
        $this->postJson("/api/user/events/{$event->id}/groups/{$group->id}/submit", ['proof' => UploadedFile::fake()->createWithContent('proof.pdf', "%PDF-1.4\n%%EOF")])->assertOk();
        $this->postJson("/api/user/events/{$event->id}/groups/{$group->id}/submit", [])->assertOk();
        $this->get("/api/user/events/{$event->id}/groups/{$group->id}/files/proof")->assertOk();
        $this->actingAs($member, 'sanctum')->postJson("/api/user/events/{$event->id}/join-team", ['kode_unik' => $team->kode_unik])->assertOk();
        $this->get("/api/user/events/{$event->id}/groups/{$group->id}/files/proof")->assertForbidden();
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/teams/{$team->id}/members/{$member->id}", ['action' => 'accept'])->assertOk();
        $this->actingAs($member, 'sanctum')->get("/api/user/events/{$event->id}/groups/{$group->id}/files/proof")->assertNotFound();
    }
}
