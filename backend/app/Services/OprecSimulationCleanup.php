<?php

namespace App\Services;

use App\Models\Oprec;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/** Local simulation maintenance; never exposed through the application API. */
class OprecSimulationCleanup
{
    public function snapshot(array $originalUserIds): array
    {
        $snapshot = [];
        foreach (DB::getSchemaBuilder()->getTables() as $metadata) {
            $table = $metadata['name'];
            if (str_starts_with($table, 'oprec') || in_array($table, ['cache', 'cache_locks', 'sessions', 'migrations',
                'password_reset_tokens', 'personal_access_tokens', 'jobs', 'job_batches', 'failed_jobs'], true)) continue;
            $query = DB::table($table);
            if ($table === 'users') $query->whereIn('id', $originalUserIds);
            $rows = $query->get()->map(fn ($row) => json_encode($row, JSON_THROW_ON_ERROR))->sort()->values()->all();
            $snapshot[$table] = ['count' => count($rows), 'sha256' => hash('sha256', json_encode($rows, JSON_THROW_ON_ERROR))];
        }
        return $snapshot;
    }

    public function inventory(array $periodIds): array
    {
        $files = ['local' => [], 'public' => []];
        foreach (Oprec::with('divisions')->whereIn('id', $periodIds)->get() as $period) {
            $files['local'][] = ['directory' => "oprec/{$period->id}"];
            foreach (DB::table('oprec_stages')->where('oprec_id', $period->id)->pluck('id') as $stageId) {
                $files['local'][] = ['directory' => "oprec/test/{$stageId}"];
            }
            if ($period->pengumuman_poster && str_starts_with($period->pengumuman_poster, 'oprec/announcements/')) {
                $files['local'][] = ['file' => $period->pengumuman_poster];
            }
            if ($period->guidebook && str_starts_with($period->guidebook, 'oprec/guidebooks/')) {
                $files['local'][] = ['file' => $period->guidebook];
            }
            foreach (collect($period->form_fields ?? [])->pluck('example_file')->filter() as $path) {
                if (str_starts_with($path, 'oprec/question-examples/')) $files['local'][] = ['file' => $path];
            }
            foreach ([$period->poster, ...$period->divisions->pluck('logo')->all()] as $url) {
                $path = parse_url((string) $url, PHP_URL_PATH);
                if ($path && preg_match('~/api/public/oprec/posters/([a-zA-Z0-9._-]+)$~', $path, $match)) {
                    $files['public'][] = ['file' => 'oprec/posters/'.$match[1]];
                }
            }
        }
        return $files;
    }

    public function purge(array $periodIds, array $accounts, array $files, ?string $runId = null, array $resultTicketHashes = []): void
    {
        if (!app()->environment('local', 'testing')) {
            throw new RuntimeException('Pembersihan simulasi hanya tersedia pada local/testing.');
        }
        foreach ($resultTicketHashes as $hash) {
            if (!is_string($hash) || !preg_match('/^[a-f0-9]{64}$/D', $hash)) throw new RuntimeException('Hash tiket hasil tidak valid.');
        }
        // Validate every file target before deleting database rows, so an invalid
        // manifest cannot leave a partially removed scenario.
        foreach ($files as $disk => $entries) {
            if (!in_array($disk, ['local', 'public'], true)) throw new RuntimeException('Disk tidak valid.');
            foreach ($entries as $entry) {
                $path = $entry['directory'] ?? $entry['file'] ?? '';
                $pattern = isset($entry['directory'])
                    ? '~^oprec/(?:[0-9]+|test/[0-9]+)$~'
                    : ($disk === 'public' ? '~^oprec/posters/[a-zA-Z0-9._-]+$~' : '~^oprec/(?:announcements/[a-zA-Z0-9._-]+|guidebooks/[a-zA-Z0-9_-]+\.pdf|question-examples/[a-zA-Z0-9_-]+\.pdf|[0-9]+/.+|test/[0-9]+/.+)$~');
                if (!preg_match($pattern, $path) || str_contains($path, '..') || str_contains($path, '\\')
                    || ($disk === 'public' && isset($entry['directory']))) {
                    throw new RuntimeException('Path berkas simulasi tidak valid.');
                }
            }
        }
        $registrationRateKeys = DB::transaction(function () use ($periodIds, $accounts, $runId) {
            Oprec::whereIn('id', $periodIds)->lockForUpdate()->get();
            foreach ($accounts as $account) {
                $user = User::whereKey($account['id'])->lockForUpdate()->first();
                if (!$user) continue;
                if ($user->email !== $account['email'] || $user->role === User::ROLE_SUPER_ADMIN
                    || !str_ends_with($user->email, '@oprec-simulation.example.test')) {
                    throw new RuntimeException('Identitas akun simulasi tidak cocok; pembersihan dibatalkan.');
                }
                if ($user->oprecRegistrations()->whereNotIn('oprec_id', $periodIds)->exists()
                    || DB::table('oprec_assessment_assignments')->whereNotIn('oprec_id', $periodIds)
                        ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('assigned_by', $user->id))->exists()
                    || DB::table('oprec_assessment_reviews')->join('oprec_registrations', 'oprec_registrations.id', '=', 'oprec_assessment_reviews.oprec_registration_id')
                        ->where('reviewer_id', $user->id)->whereNotIn('oprec_registrations.oprec_id', $periodIds)->exists()
                    || DB::table('oprec_assessment_decision_logs')->join('oprec_registrations', 'oprec_registrations.id', '=', 'oprec_assessment_decision_logs.oprec_registration_id')
                        ->where('actor_id', $user->id)->whereNotIn('oprec_registrations.oprec_id', $periodIds)->exists()
                    || $user->eventRegistrations()->exists()
                    || DB::table('team_members')->where('user_id', $user->id)->exists()) {
                    throw new RuntimeException('Akun memiliki partisipasi di luar skenario; pembersihan dibatalkan.');
                }
            }
            $registrations = DB::table('oprec_registrations')->whereIn('oprec_id', $periodIds)->get(['id', 'oprec_id', 'nim']);
            $registrationIds = $registrations->pluck('id');
            DB::table('file_uploads')->where('owner_type', 'oprec')->whereIn('owner_id', $registrationIds)->delete();
            Oprec::whereIn('id', $periodIds)->delete();
            $userIds = array_column($accounts, 'id');
            DB::table('sessions')->whereIn('user_id', $userIds)->delete();
            if ($runId) DB::table('sessions')->where('user_agent', 'like', '%SIMANIKA-OprecSimulation/'.$runId.'%')->delete();
            DB::table('personal_access_tokens')->where('tokenable_type', User::class)->whereIn('tokenable_id', $userIds)->delete();
            DB::table('password_reset_tokens')->whereIn('email', array_column($accounts, 'email'))->delete();
            User::whereIn('id', $userIds)->delete();
            return $registrations->map(fn ($registration) => hash('sha256', $registration->oprec_id.'|'.$registration->nim))->all();
        });
        foreach ($registrationRateKeys as $key) {
            RateLimiter::clear(md5('oprec-announcement'.'announcement-nim:'.$key));
            RateLimiter::clear(md5('oprec-result'.$key));
        }
        foreach ($resultTicketHashes as $hash) RateLimiter::clear(md5('oprec-result-view'.'result-ticket:'.$hash));
        foreach ($accounts as $account) {
            RateLimiter::clear(md5('oprec-submission'.'oprec-user:'.$account['id']));
            foreach (['127.0.0.1', '::1'] as $ip) {
                $key = hash('sha256', $ip.'|'.strtolower($account['email']));
                foreach (['auth', 'password'] as $limiter) RateLimiter::clear(md5($limiter.$key));
            }
        }
        foreach ($files as $disk => $entries) {
            foreach ($entries as $entry) {
                $path = $entry['directory'] ?? $entry['file'];
                // Public logos/posters can be shared with a surviving period.
                if ($disk === 'public') {
                    $name = basename($path);
                    if (Oprec::where('poster', 'like', '%/oprec/posters/'.$name)->exists()
                        || DB::table('oprec_divisions')->where('logo', 'like', '%/oprec/posters/'.$name)->exists()) continue;
                }
                $storage = Storage::disk($disk);
                $ok = isset($entry['directory']) ? $storage->deleteDirectory($path) : $storage->delete($path);
                $exists = isset($entry['directory']) ? $storage->directoryExists($path) : $storage->exists($path);
                if (!$ok && $exists) throw new RuntimeException('Berkas belum berhasil dibersihkan; ulangi pembersihan.');
            }
        }
    }
}
