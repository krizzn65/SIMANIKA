<?php

namespace App\Services;

use App\Models\Oprec;
use App\Models\OprecDivision;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/** Explicit local correction of historical applications; not an HTTP write path. */
class OprecRegistrationPositionCorrection
{
    public function correct(int $periodId, bool $dryRun = false): array
    {
        if (!app()->environment('local', 'testing')) throw new RuntimeException('Koreksi hanya tersedia pada local/testing.');

        return DB::transaction(function () use ($periodId, $dryRun) {
            Oprec::whereKey($periodId)->lockForUpdate()->firstOrFail();
            $divisions = DB::table('oprec_divisions')->where('oprec_id', $periodId)->lockForUpdate()->get()->keyBy('id');
            $divisionChanges = []; $registrationChanges = []; $choiceCount = 0;
            foreach ($divisions as $division) {
                $before = is_string($division->jabatan) ? json_decode($division->jabatan, true, 512, JSON_THROW_ON_ERROR) : $division->jabatan;
                $after = OprecDivision::defaultJabatan($division->nama);
                if (!$after) throw new RuntimeException("Nama divisi {$division->id} tidak valid.");
                if ($before !== $after) $divisionChanges[] = ['id' => $division->id, 'before' => $before, 'after' => $after];
            }
            $registrations = DB::table('oprec_registrations')->where('oprec_id', $periodId)->lockForUpdate()->get();
            foreach ($registrations as $registration) {
                $before = is_string($registration->form_data) ? json_decode($registration->form_data, true, 512, JSON_THROW_ON_ERROR) : $registration->form_data;
                if (!is_array($before)) throw new RuntimeException("Formulir pendaftaran {$registration->id} tidak valid.");
                $after = $before;
                foreach ([1, 2, 3] as $rank) {
                    $divisionId = $registration->{"divisi_pilihan_{$rank}"};
                    if ($divisionId === null) continue;
                    $division = $divisions->get($divisionId);
                    if (!$division) throw new RuntimeException("Referensi divisi pendaftaran {$registration->id} tidak valid.");
                    $key = "jabatan_pilihan_{$rank}";
                    $value = $before[$key] ?? null;
                    $positions = OprecDivision::defaultJabatan($division->nama);
                    if (count($positions) === 1) {
                        $position = $positions[0];
                    } else {
                        $position = match (is_string($value) ? mb_strtolower(trim($value)) : '') {
                            'ketua umum', 'wakil ketua umum' => 'Wakil Ketua Umum',
                            'sekretaris 1', 'sekretaris 2' => 'Sekretaris 2',
                            'bendahara 1', 'bendahara 2' => 'Bendahara 2',
                            default => throw new RuntimeException("Jabatan BPH pendaftaran {$registration->id} pilihan {$rank} tidak dapat dipetakan."),
                        };
                    }
                    $after[$key] = $position;
                    if ($value !== $position) $choiceCount++;
                }
                if ($before !== $after) $registrationChanges[] = ['id' => $registration->id, 'before' => $before, 'after' => $after];
            }

            $auditFile = null;
            if (!$dryRun && ($divisionChanges || $registrationChanges)) {
                $audit = json_encode(['period_id' => $periodId, 'planned_at' => now()->toIso8601String(),
                    'divisions' => $divisionChanges, 'registrations' => $registrationChanges], JSON_THROW_ON_ERROR);
                $auditFile = "oprec/{$periodId}/maintenance/registration-positions-".hash('sha256', $audit).'.enc';
                if (!Storage::disk('local')->put($auditFile, Crypt::encryptString($audit))) throw new RuntimeException('Cadangan koreksi tidak berhasil disimpan.');
                foreach ($divisionChanges as $change) DB::table('oprec_divisions')->where('id', $change['id'])->update(['jabatan' => json_encode($change['after'], JSON_THROW_ON_ERROR)]);
                foreach ($registrationChanges as $change) DB::table('oprec_registrations')->where('id', $change['id'])->update([
                    'form_data' => json_encode($change['after'], JSON_THROW_ON_ERROR), 'updated_at' => now(),
                ]);
            }
            return ['period_id' => $periodId, 'dry_run' => $dryRun, 'divisions_changed' => count($divisionChanges),
                'registrations_changed' => count($registrationChanges), 'choices_changed' => $choiceCount, 'audit_file' => $auditFile];
        });
    }
}
