<?php

namespace Tests\Feature;

use App\Models\Oprec;
use App\Models\User;
use App\Services\OprecSimulationCleanup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Crypt;
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
        DB::table('oprec_assessment_assignments')->insert(['oprec_id' => $period->id, 'user_id' => $original->id]);
        DB::table('oprec_enrollments')->insert(['oprec_id' => $period->id, 'user_id' => $user->id]);
        DB::table('oprec_assessment_decision_logs')->insert(['oprec_registration_id' => $registration->id,
            'actor_id' => $original->id, 'old_status' => 'pending', 'new_status' => 'accepted', 'created_at' => now()]);
        DB::table('sessions')->insert(['id' => 'anonymous-simulation-session', 'payload' => '', 'last_activity' => time(),
            'user_agent' => 'Chrome SIMANIKA-OprecSimulation/oprec-test-cleanup']);
        $limitKey = md5('oprec-submission'.'oprec-user:'.$user->id);
        RateLimiter::hit($limitKey);
        RateLimiter::hit('other-module-key');
        DB::table('sessions')->insert(['id' => 'simulation-session', 'user_id' => $user->id, 'payload' => '', 'last_activity' => time()]);
        DB::table('sessions')->insert(['id' => 'original-session', 'user_id' => $original->id, 'payload' => '', 'last_activity' => time()]);
        Storage::disk('local')->put("oprec/{$period->id}/cv.pdf", 'cv');
        Storage::disk('local')->put("oprec/test/{$stage->id}/answer.pdf", 'answer');
        Storage::disk('local')->put('oprec/announcements/simulation.png', 'poster');
        Storage::disk('public')->put('oprec/posters/simulation.png', 'poster');
        Storage::disk('local')->put('events/original.pdf', 'preserve');
        $cleanup = app(OprecSimulationCleanup::class);
        $baseline = $cleanup->snapshot([$original->id]);
        $files = $cleanup->inventory([$period->id]);
        $accounts = [['id' => $user->id, 'email' => $user->email]];
        $cleanup->purge([$period->id], $accounts, $files, 'oprec-test-cleanup');
        $cleanup->purge([$period->id], $accounts, $files, 'oprec-test-cleanup');
        $this->assertSame($baseline, $cleanup->snapshot([$original->id]));
        foreach (['oprecs', 'oprec_registrations', 'oprec_test_submissions', 'oprec_assessment_reviews', 'oprec_enrollments', 'oprec_assessment_assignments', 'oprec_assessment_decision_logs'] as $table) $this->assertDatabaseCount($table, 0);
        $this->assertDatabaseHas('users', ['id' => $original->id]);
        $this->assertDatabaseHas('sessions', ['id' => 'original-session']);
        $this->assertDatabaseMissing('sessions', ['id' => 'simulation-session']);
        $this->assertDatabaseMissing('sessions', ['id' => 'anonymous-simulation-session']);
        $this->assertSame(0, RateLimiter::attempts($limitKey));
        $this->assertSame(1, RateLimiter::attempts('other-module-key'));
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

    public function test_shared_public_poster_is_preserved_for_a_surviving_period(): void
    {
        Storage::fake('public');
        $url = 'http://localhost:8000/api/public/oprec/posters/shared.png';
        $removed = Oprec::create(['periode' => '2026/2027', 'poster' => $url]);
        $preserved = Oprec::create(['periode' => '2027/2028', 'poster' => $url]);
        Storage::disk('public')->put('oprec/posters/shared.png', 'shared poster');
        $cleanup = app(OprecSimulationCleanup::class);
        $cleanup->purge([$removed->id], [], $cleanup->inventory([$removed->id]));
        $this->assertDatabaseHas('oprecs', ['id' => $preserved->id]);
        Storage::disk('public')->assertExists('oprec/posters/shared.png');
    }

    public function test_console_dry_run_preserves_data_then_cleanup_removes_manifest_and_can_repeat(): void
    {
        Storage::fake('local'); Storage::fake('public');
        $original = User::create(['email' => 'original@example.test', 'password' => 'original-password']);
        $user = User::create(['email' => 'console@oprec-simulation.example.test', 'password' => 'simulation-password']);
        $period = Oprec::create(['periode' => '2026/2027']);
        config()->set('admin.email', $original->email);
        $original->forceFill(['role' => User::ROLE_SUPER_ADMIN])->save();
        $originalAttributes = array_intersect_key($original->getAttributes(), array_flip(['password', 'remember_token', 'updated_at']));
        $original->forceFill(['password' => 'temporary-password'])->save();
        $directory = 'oprec-simulation/oprec-console-test';
        Storage::disk('local')->put($directory.'/manifest.json', json_encode([
            'run_id' => 'oprec-console-test', 'original_user_ids' => [$original->id],
            'period_ids' => [$period->id], 'accounts' => [['id' => $user->id, 'email' => $user->email]],
            'files' => ['local' => [], 'public' => []],
        ], JSON_THROW_ON_ERROR));
        Storage::disk('local')->put($directory.'/superadmin-backup.enc', Crypt::encryptString(json_encode(['id' => $original->id, 'attributes' => $originalAttributes], JSON_THROW_ON_ERROR)));
        Storage::disk('local')->put($directory.'/credentials.json', 'private simulation artifact');
        $this->artisan('oprec:simulation-cleanup', ['run' => 'oprec-console-test', '--dry-run' => true])->assertSuccessful();
        $this->assertDatabaseHas('oprecs', ['id' => $period->id]);
        Storage::disk('local')->assertExists($directory.'/manifest.json');
        $this->artisan('oprec:simulation-cleanup', ['run' => 'oprec-console-test'])->assertSuccessful();
        $this->artisan('oprec:simulation-cleanup', ['run' => 'oprec-console-test'])->assertSuccessful();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseHas('users', ['id' => $original->id]);
        $this->assertDatabaseMissing('oprecs', ['id' => $period->id]);
        $this->assertFalse(Storage::disk('local')->directoryExists($directory));
        $this->assertSame($originalAttributes['password'], $original->fresh()->getRawOriginal('password'));
    }

    public function test_reviewer_used_in_another_period_aborts_cleanup_before_deletion(): void
    {
        $user = User::create(['email' => 'reviewer@oprec-simulation.example.test', 'password' => 'simulation-password']);
        $removed = Oprec::create(['periode' => '2026/2027']);
        $other = Oprec::create(['periode' => '2027/2028']);
        DB::table('oprec_assessment_assignments')->insert(['oprec_id' => $other->id, 'user_id' => $user->id]);
        try {
            app(OprecSimulationCleanup::class)->purge([$removed->id], [['id' => $user->id, 'email' => $user->email]], []);
            $this->fail('An account active outside the scenario must not be deleted.');
        } catch (\RuntimeException $error) {
            $this->assertStringContainsString('di luar skenario', $error->getMessage());
        }
        $this->assertDatabaseHas('oprecs', ['id' => $removed->id]);
        $this->assertDatabaseHas('oprecs', ['id' => $other->id]);
        $this->assertDatabaseHas('users', ['id' => $user->id]);
        $this->assertDatabaseHas('oprec_assessment_assignments', ['oprec_id' => $other->id]);
    }

}
