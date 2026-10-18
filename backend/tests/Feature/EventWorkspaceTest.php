<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EventWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $name): User
    {
        return $this->verifiedUser(['name' => $name, 'email' => $name.'@example.test', 'password' => 'password-testing-123']);
    }

    private function event(string $slug = 'workspace'): Event
    {
        $event = Event::create([
            'slug' => $slug, 'judul' => 'Workspace Competition', 'kategori' => 'hi-fest',
            'tanggal_mulai' => today()->addDays(5), 'tanggal_selesai' => today()->addDays(6),
            'buka_pendaftaran' => today()->subDay(), 'deadline_pendaftaran' => today()->addDays(4),
            'status' => 'published', 'tipe_pendaftaran' => 'tim', 'kode_prefix' => 'BYTE',
            'min_anggota' => 2, 'max_anggota' => 2,
        ]);
        $event->formFields()->create(['name' => 'nama_lengkap', 'label' => 'Nama lengkap', 'type' => 'text', 'required' => true]);
        return $event;
    }

    private function team(Event $event, User $leader): Team
    {
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Byte Builders'])->assertCreated();
        return $event->teams()->firstOrFail();
    }

    private function join(Event $event, User $user, Team $team): void
    {
        $this->actingAs($user, 'sanctum')->postJson("/api/user/events/{$event->id}/join-team", ['kode_unik' => strtolower($team->kode_unik)])
            ->assertOk()->assertJsonPath('data.membershipStatus', 'pending');
    }

    private function manage(Event $event, Team $team, User $member, string $action)
    {
        return $this->postJson("/api/user/events/{$event->id}/teams/{$team->id}/members/{$member->id}", ['action' => $action]);
    }

    public function test_workspace_requires_auth_and_never_exposes_another_teams_data(): void
    {
        $event = $this->event();
        $this->getJson("/api/user/events/{$event->id}/workspace")->assertUnauthorized();
        $leader = $this->user('leader');
        $team = $this->team($event, $leader);
        $outsider = $this->user('outsider');
        $this->actingAs($outsider, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")->assertNotFound();
        $this->manage($event, $team, $leader, 'remove')->assertForbidden();
        $this->actingAs($leader, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertOk()->assertHeader('Cache-Control', 'max-age=0, no-store, private')
            ->assertJsonPath('data.team.isLeader', true)->assertJsonPath('data.team.memberCount', 1)
            ->assertJsonPath('data.form.canSubmit', true)->assertDontSee($leader->email);
    }

    public function test_join_waits_for_leader_and_only_accepted_members_count(): void
    {
        $event = $this->event(); $leader = $this->user('leader'); $member = $this->user('member');
        $team = $this->team($event, $leader);
        $this->join($event, $member, $team);
        $this->join($event, $member, $team); // Retried request is idempotent.
        $this->assertDatabaseCount('team_members', 2);
        $this->getJson('/api/user/dashboard')->assertJsonPath('data.items.0.status', 'join_pending')
            ->assertJsonPath('data.items.0.teamMembers', 1)->assertJsonPath('data.items.0.href', '/dashboard/events/'.$event->id);
        $this->getJson("/api/user/events/{$event->id}/workspace")->assertOk()
            ->assertJsonCount(0, 'data.team.members')->assertJsonCount(0, 'data.team.requests')
            ->assertJsonCount(0, 'data.form.answers')->assertJsonPath('data.form.canSubmit', false);
        $this->manage($event, $team, $member, 'accept')->assertForbidden();
        $this->postJson("/api/user/events/{$event->id}/register", ['nama_lengkap' => 'Member'])->assertForbidden();
        $this->actingAs($leader, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertJsonCount(1, 'data.team.requests');
        $this->manage($event, $team, $member, 'accept')->assertOk();
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'jumlah_anggota' => 2, 'completion_status' => 'complete']);
        $this->actingAs($member, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")
            ->assertJsonCount(2, 'data.team.members')->assertJsonPath('data.team.canManage', false);
        $this->manage($event, $team, $leader, 'remove')->assertForbidden();
    }

    public function test_capacity_is_rechecked_at_approval_and_duplicate_event_membership_is_blocked(): void
    {
        $event = $this->event(); $leader = $this->user('leader'); $one = $this->user('one'); $two = $this->user('two');
        $team = $this->team($event, $leader);
        $this->join($event, $one, $team); $this->join($event, $two, $team);
        $this->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Duplicate'])->assertUnprocessable();
        $this->actingAs($leader, 'sanctum');
        $this->manage($event, $team, $one, 'accept')->assertOk();
        $this->manage($event, $team, $two, 'accept')->assertUnprocessable();
        $this->manage($event, $team, $one, 'accept')->assertUnprocessable();
        $this->assertDatabaseHas('team_members', ['user_id' => $two->id, 'status' => 'pending']);
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'jumlah_anggota' => 2]);
        $this->manage($event, $team, $leader, 'remove')->assertUnprocessable();
    }

    public function test_removal_revokes_access_updates_count_and_rejection_allows_rejoining(): void
    {
        $event = $this->event(); $leader = $this->user('leader'); $member = $this->user('member');
        $team = $this->team($event, $leader); $this->join($event, $member, $team);
        $this->actingAs($leader, 'sanctum');
        $this->manage($event, $team, $member, 'remove')->assertOk();
        $this->join($event, $member, $team);
        $this->actingAs($leader, 'sanctum');
        $this->manage($event, $team, $member, 'accept')->assertOk();
        $this->manage($event, $team, $member, 'remove')->assertOk();
        $this->assertDatabaseHas('teams', ['id' => $team->id, 'jumlah_anggota' => 1, 'completion_status' => 'incomplete']);
        $this->assertDatabaseMissing('event_enrollments', ['event_id' => $event->id, 'user_id' => $member->id]);
        $this->actingAs($member, 'sanctum')->getJson("/api/user/events/{$event->id}/workspace")->assertNotFound();
        $this->getJson('/api/user/dashboard')->assertJsonCount(0, 'data.items');
    }

    public function test_roster_locks_after_deadline_or_admin_acceptance_and_cross_event_ids_fail(): void
    {
        $event = $this->event(); $leader = $this->user('leader'); $member = $this->user('member');
        $team = $this->team($event, $leader); $this->join($event, $member, $team);
        $otherEvent = $this->event('other');
        $this->actingAs($leader, 'sanctum');
        $this->manage($otherEvent, $team, $member, 'accept')->assertNotFound();
        $this->manage($event, $team, $member, 'paid')->assertUnprocessable();
        $event->update(['deadline_pendaftaran' => today()->subDay()]);
        $this->manage($event, $team, $member, 'accept')->assertUnprocessable();
        $this->manage($event, $team, $member, 'remove')->assertUnprocessable();
        $event->update(['deadline_pendaftaran' => today()->addDays(4)]);
        $team->update(['review_status' => 'accepted']);
        $this->manage($event, $team, $member, 'accept')->assertUnprocessable();
        $this->postJson("/api/user/events/{$event->id}/register", ['nama_lengkap' => 'Leader'])->assertUnprocessable();
        $this->getJson("/api/user/events/{$event->id}/workspace")->assertJsonPath('data.team.canManage', false);
        $this->actingAs($this->user('late'), 'sanctum')->postJson("/api/user/events/{$event->id}/join-team", ['kode_unik' => $team->kode_unik])->assertUnprocessable();
    }

    public function test_captain_submits_existing_team_and_uploads_remain_private(): void
    {
        Storage::fake('local');
        $event = $this->event(); $leader = $this->user('leader'); $member = $this->user('member');
        $event->formFields()->create(['name' => 'proof', 'label' => 'Bukti', 'type' => 'file', 'required' => true]);
        $team = $this->team($event, $leader); $this->join($event, $member, $team);
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/register", [])->assertUnprocessable();
        $this->postJson("/api/user/events/{$event->id}/register", ['nama_lengkap' => 'Leader', 'proof' => UploadedFile::fake()->create('bad.exe', 10)])
            ->assertUnprocessable();
        $pdf = UploadedFile::fake()->createWithContent('proof.pdf', "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF");
        $this->postJson("/api/user/events/{$event->id}/register", ['nama_lengkap' => 'Leader', 'proof' => $pdf])
            ->assertCreated()->assertJsonPath('data.submitted', true);
        $this->assertDatabaseCount('teams', 1);
        $this->assertNotNull($team->fresh()->form_submitted_at);
        $path = $team->fresh()->form_data['proof'];
        Storage::disk('local')->assertExists($path);
        $this->getJson("/api/user/events/{$event->id}/workspace")->assertJsonPath('data.form.submitted', true)
            ->assertJsonPath('data.form.reviewStatus', 'pending')->assertDontSee($path);
        $this->get("/api/user/events/{$event->id}/files/proof")->assertOk();
        $this->actingAs($member, 'sanctum')->getJson("/api/user/events/{$event->id}/files/proof")->assertForbidden();
        $this->actingAs($leader, 'sanctum');
        $this->manage($event, $team, $member, 'accept')->assertOk();
        $this->actingAs($member, 'sanctum')->get("/api/user/events/{$event->id}/files/proof")->assertOk();
        $this->actingAs($leader, 'sanctum');
        $this->manage($event, $team, $member, 'remove')->assertOk();
        $this->actingAs($member, 'sanctum')->getJson("/api/user/events/{$event->id}/files/proof")->assertNotFound();
    }

    public function test_individual_enrollment_can_submit_and_view_own_form(): void
    {
        $event = $this->event(); $event->update(['tipe_pendaftaran' => 'individu', 'payment_type' => 'paid', 'htm' => 50000]);
        $user = $this->user('individual');
        $this->actingAs($user, 'sanctum')->postJson("/api/user/events/{$event->id}/enroll")->assertSuccessful();
        $this->getJson("/api/user/events/{$event->id}/workspace")->assertOk()->assertJsonPath('data.form.canSubmit', true)
            ->assertJsonPath('data.paymentStatus', 'unpaid')->assertJsonPath('data.htm', 50000);
        $this->postJson("/api/user/events/{$event->id}/register", ['nama_lengkap' => 'Individual'])->assertCreated();
        $this->getJson("/api/user/events/{$event->id}/workspace")->assertJsonPath('data.form.answers.0.value', 'Individual');
        $this->postJson("/api/user/events/{$event->id}/register", ['nama_lengkap' => 'Duplicate'])->assertConflict();
        $this->assertDatabaseCount('event_registrations', 1);
    }
}
