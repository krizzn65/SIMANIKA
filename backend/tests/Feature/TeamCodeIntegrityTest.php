<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamCodeIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $name): User
    {
        return User::create(['name' => $name, 'email' => "$name@example.test", 'password' => 'password-testing-123']);
    }

    private function admin(): User
    {
        config()->set('admin.email', 'official@example.test');
        $admin = $this->user('official');
        $admin->forceFill(['role' => 'admin'])->save();
        return $admin;
    }

    private function payload(string $slug, string $prefix): array
    {
        return [
            'slug' => $slug, 'judul' => 'Lomba '.$slug, 'kategori' => 'hi-fest',
            'tanggal_mulai' => today()->addDays(8)->toDateString(),
            'tanggal_selesai' => today()->addDays(9)->toDateString(),
            'buka_pendaftaran' => today()->subDay()->toDateString(),
            'deadline_pendaftaran' => today()->addDays(7)->toDateString(),
            'tipe' => 'online', 'status' => 'draft', 'tipe_pendaftaran' => 'tim',
            'payment_type' => 'free', 'kode_prefix' => $prefix,
            'min_anggota' => 2, 'max_anggota' => 3,
        ];
    }

    private function legacyEvent(string $slug, string $prefix = 'HACK'): Event
    {
        $payload = $this->payload($slug, $prefix);
        $payload['status'] = 'published';
        $event = Event::create($payload);
        $event->formFields()->create(['name' => 'nama', 'label' => 'Nama', 'type' => 'text', 'required' => true]);
        return $event;
    }

    public function test_admin_prefix_is_unique_while_in_use_and_reusable_after_event_removal(): void
    {
        $payload = $this->payload('hack-one', 'HACK');
        $this->postJson('/api/admin/events', $payload)->assertUnauthorized();
        $this->actingAs($this->user('ordinary'), 'sanctum')->postJson('/api/admin/events', $payload)->assertForbidden();
        $this->actingAs($this->admin(), 'sanctum')->postJson('/api/admin/events', $payload)->assertCreated();
        $this->postJson('/api/admin/events', $this->payload('hack-two', 'HACK'))
            ->assertUnprocessable()->assertJsonValidationErrors('kode_prefix');
        $this->assertDatabaseCount('events', 1);
        $this->assertDatabaseHas('team_code_sequences', ['prefix' => 'HACK', 'last_number' => 0]);

        $event = Event::firstOrFail();
        $this->putJson("/api/admin/events/{$event->id}", $this->payload('hack-one', 'BYTE'))->assertOk();
        $this->postJson('/api/admin/events', $this->payload('hack-three', 'HACK'))->assertCreated();
        $this->assertDatabaseHas('team_code_sequences', ['prefix' => 'BYTE']);
        $this->deleteJson("/api/admin/events/{$event->id}")->assertNoContent();
        // Reusing the exact title/slug is allowed after deletion too.
        $this->postJson('/api/admin/events', $this->payload('hack-one', 'BYTE'))->assertCreated();
    }

    public function test_legacy_duplicate_prefixes_receive_distinct_new_codes_without_changing_old_codes(): void
    {
        $first = $this->legacyEvent('legacy-one');
        $second = $this->legacyEvent('legacy-two');
        $leaderOne = $this->user('leaderone');
        $leaderTwo = $this->user('leadertwo');
        $leaderThree = $this->user('leaderthree');
        $this->actingAs($leaderOne, 'sanctum')->postJson("/api/user/events/{$first->id}/create-team", ['nama_tim' => 'Satu'])
            ->assertCreated()->assertJsonPath('data.teamCode', 'HACK01');
        $this->actingAs($leaderTwo, 'sanctum')->postJson("/api/user/events/{$second->id}/create-team", ['nama_tim' => 'Dua'])
            ->assertCreated()->assertJsonPath('data.teamCode', 'HACK02');
        $this->actingAs($leaderThree, 'sanctum')->postJson("/api/user/events/{$first->id}/create-team", ['nama_tim' => 'Tiga'])
            ->assertCreated()->assertJsonPath('data.teamCode', 'HACK03');
        $this->postJson("/api/user/events/{$second->id}/join-team", ['kode_unik' => 'HACK01'])->assertUnprocessable();
        $this->assertDatabaseHas('team_code_sequences', ['prefix' => 'HACK', 'last_number' => 3]);
        $this->assertDatabaseCount('team_code_reservations', 3);
    }

    public function test_team_settings_cannot_change_after_participation(): void
    {
        $admin = $this->admin();
        $event = $this->legacyEvent('locked-event', 'SAFE');
        $leader = $this->user('captain');
        $this->actingAs($leader, 'sanctum')->postJson("/api/user/events/{$event->id}/create-team", ['nama_tim' => 'Locked'])->assertCreated();
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/events/{$event->id}", $this->payload('locked-event', 'OTHER'))
            ->assertUnprocessable()->assertJsonValidationErrors('kode_prefix');
        $changedSize = $this->payload('locked-event', 'SAFE');
        $changedSize['max_anggota'] = 5;
        $this->putJson("/api/admin/events/{$event->id}", $changedSize)->assertUnprocessable();
        $this->assertDatabaseHas('events', ['id' => $event->id, 'kode_prefix' => 'SAFE', 'max_anggota' => 3]);
        $this->assertDatabaseMissing('team_code_sequences', ['prefix' => 'OTHER']);
    }
}
