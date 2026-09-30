<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\User;
use App\Services\OprecAnnouncementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecAnnouncementTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(): array
    {
        Storage::fake('local');
        $this->travelTo(now()->startOfMinute());
        $oprec = Oprec::create(['periode' => '2026/2027', 'status' => 'closed', 'first_published_at' => now()->subDays(3), 'form_fields' => []]);
        $division = $oprec->divisions()->create(['nama' => 'Humas', 'sort_order' => 1]);
        $user = User::create(['email' => 'participant@example.test', 'password' => 'testing-password']);
        $registration = $oprec->registrations()->create(['user_id' => $user->id, 'nim' => 'E312345', 'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'Peserta'], 'status' => 'accepted', 'accepted_division_id' => $division->id, 'accepted_position' => 'Staff Divisi Humas']);
        $stage = $oprec->writtenTest()->create(['type' => 'test_tulis', 'headline' => 'Tes Tulis', 'published' => true, 'tanggal_buka' => now()->subDays(2), 'tanggal_tutup' => now()->subDay(), 'form_fields' => []]);
        $stage->submissions()->create(['oprec_registration_id' => $registration->id, 'user_id' => $user->id, 'answers' => []]);
        return [$oprec, $registration];
    }

    private function payload(): array
    {
        return ['title' => 'Hasil seleksi', 'description' => 'Terima kasih telah mengikuti seleksi.', 'release_at' => now()->addHour()->toIso8601String(), 'whatsapp_url' => 'https://chat.whatsapp.com/ExampleInvite', 'poster' => UploadedFile::fake()->createWithContent('poster.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='))];
    }

    public function test_admin_can_schedule_but_incomplete_decisions_and_other_roles_cannot(): void
    {
        [$oprec, $registration] = $this->fixture();
        $url = "/api/admin/oprec/{$oprec->id}/announcement";
        $actor = User::create(['email' => 'reviewer@example.test', 'password' => 'testing-password']);
        $actor->forceFill(['role' => 'leader'])->save();
        $this->actingAs($actor, 'sanctum')->postJson($url, $this->payload())->assertForbidden();
        $actor->forceFill(['role' => 'admin'])->save();
        $registration->update(['status' => 'pending']);
        $this->postJson($url, $this->payload())->assertUnprocessable();
        $registration->update(['status' => 'accepted']);
        $this->postJson($url, $this->payload())->assertOk()->assertJsonPath('data.exists', true);
        $this->getJson($url)->assertOk()->assertJsonPath('participants.data.0.nim', 'E312345');
        $this->assertTrue($oprec->fresh()->pengumuman_published);
        $this->travel(2)->hours();
        $this->postJson($url, $this->payload())->assertStatus(409);
    }

    public function test_schedule_hides_sensitive_metadata_and_rejects_early_lookup(): void
    {
        [$oprec] = $this->fixture();
        $oprec->forceFill(['pengumuman_published' => true, 'pengumuman_tanggal' => now()->addHour(), 'pengumuman_pesan' => 'Private description', 'pengumuman_grup_wa' => 'https://chat.whatsapp.com/Secret'])->save();
        $base = "/api/public/oprec/{$oprec->id}/announcement";
        $this->getJson($base)->assertOk()->assertJsonPath('data.released', false)->assertJsonPath('data.description', '')->assertJsonMissingPath('data.whatsapp_url');
        $this->postJson($base.'/verify', ['nim' => 'E312345', 'tanggal_lahir' => '2004-01-01'])->assertStatus(409);
        $this->getJson($base.'/poster')->assertNotFound();
    }

    public function test_ticket_is_private_expiring_and_bound_to_period_and_submitted_participant(): void
    {
        [$oprec, $registration] = $this->fixture();
        $oprec->forceFill(['pengumuman_published' => true, 'pengumuman_tanggal' => now(), 'pengumuman_grup_wa' => 'https://chat.whatsapp.com/Secret'])->save();
        $base = "/api/public/oprec/{$oprec->id}/announcement";
        $ticket = $this->postJson($base.'/verify', ['nim' => ' e312345 ', 'tanggal_lahir' => '2004-01-01'])->assertOk()->assertJsonMissingPath('data')->json('ticket');
        $this->postJson($base.'/result', ['ticket' => $ticket])->assertOk()->assertJsonPath('data.status', 'accepted')->assertJsonPath('data.whatsapp_url', 'https://chat.whatsapp.com/Secret')->assertJsonMissingPath('data.tanggal_lahir')->assertJsonMissingPath('data.poster');
        $this->postJson($base.'/verify', ['nim' => 'E312345', 'tanggal_lahir' => '2004-01-02'])->assertNotFound();
        $this->postJson($base.'/result', ['ticket' => 'forged'])->assertUnauthorized();
        $other = Oprec::create(['periode' => '2027/2028', 'status' => 'closed', 'pengumuman_published' => true]);
        $this->postJson("/api/public/oprec/{$other->id}/announcement/result", ['ticket' => $ticket])->assertUnauthorized();
        $registration->update(['status' => 'rejected']);
        $this->postJson($base.'/result', ['ticket' => $ticket])->assertOk()->assertJsonPath('data.whatsapp_url', null)->assertJsonPath('data.position', null);
        $this->travel(OprecAnnouncementService::TICKET_SECONDS)->seconds();
        $this->postJson($base.'/result', ['ticket' => $ticket])->assertUnauthorized();
        $oprec->writtenTest->submissions()->delete();
        $this->postJson($base.'/verify', ['nim' => 'E312345', 'tanggal_lahir' => '2004-01-01'])->assertNotFound();
    }

    public function test_readiness_rejects_draft_open_unfinished_and_incomplete_placement(): void
    {
        [$oprec, $registration] = $this->fixture();
        $service = app(OprecAnnouncementService::class);
        $this->assertSame([], $service->blockers($oprec));
        $oprec->update(['status' => 'draft']);
        $this->assertNotEmpty($service->blockers($oprec->fresh()));
        $oprec->update(['status' => 'open', 'tanggal_tutup' => now()->addDay()]);
        $this->assertNotEmpty($service->blockers($oprec->fresh()));
        $oprec->update(['status' => 'closed']);
        $oprec->writtenTest->update(['tanggal_tutup' => now()->addDay()]);
        $this->assertNotEmpty($service->blockers($oprec->fresh()));
        $oprec->writtenTest->update(['tanggal_tutup' => now()->subDay()]);
        $registration->update(['accepted_position' => '   ']);
        $this->assertNotEmpty($service->blockers($oprec->fresh()));
        $other = Oprec::create(['periode' => '2027/2028', 'status' => 'closed']);
        $division = $other->divisions()->create(['nama' => 'Humas', 'sort_order' => 0]);
        $registration->update(['accepted_position' => 'Staff', 'accepted_division_id' => $division->id]);
        $this->assertNotEmpty($service->blockers($oprec->fresh()));
    }

    public function test_malformed_identity_and_ticket_are_validation_errors_not_server_errors(): void
    {
        [$oprec] = $this->fixture();
        $oprec->forceFill(['pengumuman_published' => true, 'pengumuman_tanggal' => now()])->save();
        $base = "/api/public/oprec/{$oprec->id}/announcement";
        $this->postJson($base.'/verify', ['nim' => ['E312345'], 'tanggal_lahir' => '2004-01-01'])->assertUnprocessable();
        $this->postJson($base.'/result', ['ticket' => ['forged']])->assertUnprocessable();
    }

    public function test_accepted_table_sorts_division_then_position_and_excludes_private_identity(): void
    {
        [$oprec] = $this->fixture();
        $bph = $oprec->divisions()->create(['nama' => 'BPH', 'sort_order' => 9]);
        foreach (['Wakil Ketua Umum', 'Ketua Umum'] as $index => $position) {
            $user = User::create(['email' => "bph{$index}@example.test", 'password' => 'testing-password']);
            $registration = $oprec->registrations()->create(['user_id' => $user->id, 'nim' => 'E31999'.$index, 'tanggal_lahir' => '2004-01-01', 'form_data' => ['nama' => 'BPH '.$index], 'status' => 'accepted', 'accepted_division_id' => $bph->id, 'accepted_position' => $position]);
            $oprec->writtenTest->submissions()->create(['oprec_registration_id' => $registration->id, 'user_id' => $user->id, 'answers' => ['private_answer' => 'private']]);
        }
        $actor = User::create(['email' => 'reader@example.test', 'password' => 'testing-password']);
        foreach (['kwu', 'user'] as $role) {
            $actor->forceFill(['role' => $role])->save();
            $this->actingAs($actor, 'sanctum')->getJson("/api/admin/oprec/{$oprec->id}/announcement")->assertForbidden();
        }
        $actor->forceFill(['role' => 'leader'])->save();
        $this->actingAs($actor, 'sanctum')->getJson("/api/admin/oprec/{$oprec->id}/announcement")->assertOk()
            ->assertJsonPath('participants.data.0.position', 'Ketua Umum')
            ->assertJsonPath('participants.data.1.position', 'Wakil Ketua Umum')
            ->assertJsonPath('participants.data.2.division', 'Humas')
            ->assertJsonMissingPath('participants.data.0.tanggal_lahir')
            ->assertJsonMissingPath('participants.data.0.form_data')
            ->assertJsonMissingPath('participants.data.0.answers');
    }
}
