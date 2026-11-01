<?php

use App\Services\OprecSimulationCleanup;
use App\Services\OprecRegistrationPositionCorrection;
use App\Models\AuditEntry;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('audit:prune {--dry-run : Tampilkan jumlah log yang akan dihapus}', function () {
    // Keep today and the previous five calendar dates in the admin's WIB timezone.
    $cutoff = now('Asia/Jakarta')->startOfDay()->subDays(5)->utc();
    // MySQL TIMESTAMP comparisons use the configured connection timezone.
    $dbCutoff = match (config('database.default')) {
        'sqlite' => $cutoff->format('Y-m-d H:i:s'),
        'mysql' => $cutoff->copy()->setTimezone(config('database.connections.mysql.timezone') ?? 'UTC')->format('Y-m-d H:i:s'),
        default => $cutoff->toIso8601String(),
    };
    $query = AuditEntry::query()->where('created_at', '<', $dbCutoff);
    $count = $this->option('dry-run') ? $query->count() : $query->delete();
    $this->info(($this->option('dry-run') ? 'Akan dihapus: ' : 'Dihapus: ').$count.' log sebelum '.$cutoff->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s').' WIB.');
})->purpose('Hapus log sistem yang lebih tua dari lima hari kalender WIB');

Schedule::command('audit:prune')->dailyAt('00:05')->timezone('Asia/Jakarta');

Artisan::command('oprec:normalize-registration-positions {period : ID periode} {--dry-run : Periksa tanpa mengubah data}', function () {
    $period = (string) $this->argument('period');
    if (!ctype_digit($period) || (int) $period < 1) throw new RuntimeException('ID periode tidak valid.');
    $report = app(OprecRegistrationPositionCorrection::class)->correct((int) $period, $this->option('dry-run'));
    $this->info(json_encode($report, JSON_THROW_ON_ERROR));
})->purpose('Menyesuaikan jabatan pendaftaran lama ke katalog tetap tanpa mengubah penerimaan');

Artisan::command('oprec:simulation-cleanup {run : ID skenario} {--dry-run : Hanya tampilkan jumlah target}', function () {
    if (!app()->environment('local', 'testing')) throw new RuntimeException('Perintah hanya tersedia pada local/testing.');
    $run = $this->argument('run');
    if (!preg_match('/^oprec-[a-zA-Z0-9-]+$/', $run)) throw new RuntimeException('ID skenario tidak valid.');
    $directory = 'oprec-simulation/'.$run;
    $storage = Storage::disk('local');
    if (!$storage->exists($directory.'/manifest.json')) {
        if ($storage->directoryExists($directory) && !$this->option('dry-run')) {
            $storage->deleteDirectory($directory);
            if ($storage->directoryExists($directory)) throw new RuntimeException('Artefak lokal masih terkunci; tutup proses browser/server skenario lalu ulangi.');
        }
        $this->info('Manifest tidak ditemukan; tidak ada data database yang diubah.');
        return;
    }
    $manifest = json_decode($storage->get($directory.'/manifest.json'), true, 512, JSON_THROW_ON_ERROR);
    if (($manifest['run_id'] ?? null) !== $run) throw new RuntimeException('Manifest skenario tidak cocok.');
    $periods = $manifest['period_ids'] ?? [];
    $accounts = $manifest['accounts'] ?? [];
    if (array_intersect(array_column($accounts, 'id'), $manifest['original_user_ids'] ?? [])) throw new RuntimeException('Manifest memuat akun asli.');
    $this->info(count($periods).' periode dan '.count($accounts).' akun simulasi.');
    if ($this->option('dry-run')) return;
    $cleanup = app(OprecSimulationCleanup::class);
    $files = $manifest['files'] ?? ['local' => [], 'public' => []];
    foreach ($cleanup->inventory($periods) as $disk => $entries) $files[$disk] = array_merge($files[$disk] ?? [], $entries);
    $manifest['files'] = $files;
    $storage->put($directory.'/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    if ($storage->exists($directory.'/superadmin-backup.enc')) {
        $original = json_decode(Crypt::decryptString($storage->get($directory.'/superadmin-backup.enc')), true, 512, JSON_THROW_ON_ERROR);
        $admin = \App\Models\User::findOrFail($original['id']);
        if (!$admin->isSuperAdmin()) throw new RuntimeException('Identitas Super Admin berubah.');
        DB::table('users')->where('id', $admin->id)->update($original['attributes']);
    }
    $baseline = $cleanup->snapshot($manifest['original_user_ids'] ?? []);
    $cleanup->purge($periods, $accounts, $files, $run, $manifest['result_ticket_hashes'] ?? []);
    if ($cleanup->snapshot($manifest['original_user_ids'] ?? []) !== $baseline) throw new RuntimeException('Data akun asli atau modul lain berubah saat pembersihan; manifest dipertahankan untuk pemeriksaan.');
    if (DB::table('oprecs')->whereIn('id', $periods)->exists() || DB::table('users')->whereIn('id', array_column($accounts, 'id'))->exists()) {
        throw new RuntimeException('Pembersihan database belum lengkap.');
    }
    $storage->deleteDirectory($directory);
    if ($storage->directoryExists($directory)) throw new RuntimeException('Artefak lokal masih terkunci; tutup proses browser/server skenario lalu ulangi.');
    $this->info('Data, akun, sesi, berkas, dan artefak skenario berhasil dibersihkan.');
})->purpose('Membersihkan skenario OPREC lokal beserta akun dan berkas yang tercatat pada manifest');
