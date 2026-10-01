<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\User;
use App\Services\OprecSimulationCleanup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecSimulationCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_cleanup_removes_published_assessed_data_files_and_sessions_and_can_be_repeated(): void
    {
        Storage::fake('local'); Storage::fake('public');
        $original = User::create(['email' => 'original@example.test', 'password' => 'original-password']);
        $user = User::create(['email' => 'participant@oprec-simulation.example.test', 'password' => 'simulation-password']);
        $period = Oprec::create(['periode' => '2026/2027', 'status' => 'closed', 'pengumuman_published' => true,
            'poster' => 'http://localhost:8000/api/public/oprec/posters/simulation.png']);
        $period->forceFill(['pengumuman_poster' => 'oprec/announcements/simulation.png'])->save();
        $division = $period->divisions()->create(['nama' => 'BPH']);
        $registration = $period->registrations()->create(['user_id' => $user->id, 'nim' => 'E3126001',
            'tanggal_lahir' => '2005-01-01', 'form_data' => [], 'status' => 'accepted', 'accepted_division_id' => $division->id]);
        $stage = $period->writtenTest()->create(['type' => 'test_tulis', 'headline' => 'Tes Simulasi', 'published' => true,
            'tanggal_buka' => now()->subHour(), 'tanggal_tutup' => now()->subMinute()]);
        $stage->submissions()->create(['oprec_registration_id' => $registration->id, 'user_id' => $user->id, 'answers' => []]);
        DB::table('oprec_assessment_reviews')->insert(['oprec_registration_id' => $registration->id, 'reviewer_id' => $original->id,
            'reviewer_name' => 'Penilai', 'pemahaman' => 8]);
        DB::table('sessions')->insert(['id' => 'simulation-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        DB::table('sessions')->insert(['id' => 'original-session', 'user_id' => $original->id, 'payload' => '', 'last_activity' => time()]);
        Storage::disk('local')->put("oprec/{$period->id}/cv.pdf", 'cv');
        Storage::disk('local')->put("oprec/test/{$stage->id}/answer.pdf", 'answer');
        Storage::disk('local')->put('oprec/announcements/simulation.png', 'poster');
        Storage::disk('public')->put('oprec/posters/simulation.png', 'poster');
        Storage::disk('local')->put('events/original.pdf', 'preserve');
        $cleanup = app(OprecSimulationCleanup::class);
        $files = $cleanup->inventory([$period->id]);
        $accounts = [['id' => $user->id, 'email' => $user->email]];
        $cleanup->purge([$period->id], $accounts, $files);
        $cleanup->purge([$period->id], $accounts, $files);
        foreach (['oprecs', 'oprec_registrations', 'oprec_test_submissions', 'oprec_assessment_reviews'] as $table) $this->assertDatabaseCount($table, 0);
        $this->assertDatabaseHas('users', ['id' => $original->id]);
        $this->assertDatabaseHas('sessions', ['id' => 'original-session']);
        $this->assertDatabaseMissing('sessions', ['id' => 'simulation-session']);
        Storage::disk('local')->assertMissing("oprec/{$period->id}/cv.pdf");
        Storage::disk('local')->assertMissing("oprec/test/{$stage->id}/answer.pdf");
        Storage::disk('local')->assertMissing('oprec/announcements/simulation.png');
        Storage::disk('public')->assertMissing('oprec/posters/simulation.png');
        Storage::disk('local')->assertExists('events/original.pdf');
    }

    public function test_mismatched_account_aborts_before_any_period_is_deleted(): void
    {
        $original = User::create(['email' => 'original@example.test', 'password' => 'original-password']);
        $period = Oprec::create(['periode' => '2026/2027']);
        try {
            app(OprecSimulationCleanup::class)->purge([$period->id], [['id' => $original->id, 'email' => 'forged@oprec-simulation.example.test']], []);
            $this->fail('An original account must never be deleted.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('Identitas', $error->getMessage());
        }
        $this->assertDatabaseHas('oprecs', ['id' => $period->id]);
        $this->assertDatabaseHas('users', ['id' => $original->id]);
    }
    public function test_invalid_storage_target_aborts_before_database_deletion(): void
    {
        $period = Oprec::create(['periode' => '2026/2027']);
        try {
            app(OprecSimulationCleanup::class)->purge([$period->id], [], ['local' => [['directory' => 'oprec/']]]);
            $this->fail('The OPREC storage root must never be deleted.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('Path', $error->getMessage());
        }
        $this->assertDatabaseHas('oprecs', ['id' => $period->id]);
    }

}
