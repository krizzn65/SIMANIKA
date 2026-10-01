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
            foreach ([$period->poster, ...$period->divisions->pluck('logo')->all()] as $url) {
                $path = parse_url((string) $url, PHP_URL_PATH);
                if ($path && preg_match('~/api/public/oprec/posters/([a-zA-Z0-9._-]+)$~', $path, $match)) {
                    $files['public'][] = ['file' => 'oprec/posters/'.$match[1]];
                }
            }
        }
        return $files;
    }

    public function purge(array $periodIds, array $accounts, array $files, ?string $runId = null): void
    {
        if (!app()->environment('local', 'testing')) {
            throw new RuntimeException('Pembersihan simulasi hanya tersedia pada local/testing.');
        }
        // Validate every file target before deleting database rows, so an invalid
        // manifest cannot leave a partially removed scenario.
        foreach ($files as $disk => $entries) {
            if (!in_array($disk, ['local', 'public'], true)) throw new RuntimeException('Disk tidak valid.');
            foreach ($entries as $entry) {
                $path = $entry['directory'] ?? $entry['file'] ?? '';
                $pattern = isset($entry['directory'])
                    ? '~^oprec/(?:[0-9]+|test/[0-9]+)$~'
                    : ($disk === 'public' ? '~^oprec/posters/[a-zA-Z0-9._-]+$~' : '~^oprec/(?:announcements/[a-zA-Z0-9._-]+|[0-9]+/.+|test/[0-9]+/.+)$~');
                if (!preg_match($pattern, $path) || str_contains($path, '..') || str_contains($path, '\\')
                    || ($disk === 'public' && isset($entry['directory']))) {
                    throw new RuntimeException('Path berkas simulasi tidak valid.');
                }
            }
        }
        DB::transaction(function () use ($periodIds, $accounts, $runId) {
            Oprec::whereIn('id', $periodIds)->lockForUpdate()->get();
            foreach ($accounts as $account) {
                $user = User::whereKey($account['id'])->lockForUpdate()->first();
                if (!$user) continue;
                if ($user->email !== $account['email'] || $user->role === User::ROLE_SUPER_ADMIN
                    || !str_ends_with($user->email, '@oprec-simulation.example.test')) {
                    throw new RuntimeException('Identitas akun simulasi tidak cocok; pembersihan dibatalkan.');
                }
                if ($user->oprecRegistrations()->whereNotIn('oprec_id', $periodIds)->exists()
                    || $user->eventRegistrations()->exists()
                    || DB::table('team_members')->where('user_id', $user->id)->exists()) {
                    throw new RuntimeException('Akun memiliki partisipasi di luar skenario; pembersihan dibatalkan.');
                }
            }
            $registrationIds = DB::table('oprec_registrations')->whereIn('oprec_id', $periodIds)->pluck('id');
            DB::table('file_uploads')->where('owner_type', 'oprec')->whereIn('owner_id', $registrationIds)->delete();
            Oprec::whereIn('id', $periodIds)->delete();
            $userIds = array_column($accounts, 'id');
            DB::table('sessions')->whereIn('user_id', $userIds)->delete();
            if ($runId) DB::table('sessions')->where('user_agent', 'like', '%SIMANIKA-OprecSimulation/'.$runId.'%')->delete();
            DB::table('personal_access_tokens')->where('tokenable_type', User::class)->whereIn('tokenable_id', $userIds)->delete();
            DB::table('password_reset_tokens')->whereIn('email', array_column($accounts, 'email'))->delete();
            User::whereIn('id', $userIds)->delete();
        });
        foreach ($accounts as $account) {
            RateLimiter::clear('oprec-user:'.$account['id']);
            foreach (['127.0.0.1', '::1'] as $ip) RateLimiter::clear(hash('sha256', $ip.'|'.$account['email']));
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
