<?php

namespace App\Services;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OprecAssessmentService
{
    public const CRITERIA = ['pemahaman', 'kepribadian', 'public_speaking', 'kejujuran', 'problem_solving', 'kerja_sama'];

    public function authorize(User $user, Oprec $oprec): void
    {
        abort_unless($user->canAccessArea('oprec'), 403);
        if ($user->effectiveRole() === User::ROLE_LEADER) {
            abort_unless(DB::table('oprec_assessment_assignments')->where('oprec_id', $oprec->id)
                ->where('user_id', $user->id)->whereNull('revoked_at')->exists(), 403);
        }
    }

    public function writable(User $user, Oprec $oprec): void
    {
        $this->authorize($user, $oprec);
        abort_unless(in_array($user->effectiveRole(), [User::ROLE_SUPER_ADMIN, User::ROLE_LEADER], true), 403);
        abort_if($oprec->pengumuman_published, 409, 'Penilaian terkunci setelah pengumuman dipublikasikan.');
    }

    public function superAdmin(User $user, Oprec $oprec): void
    {
        $this->authorize($user, $oprec);
        abort_unless($user->isSuperAdmin(), 403);
    }

    public static function total($review): ?float
    {
        foreach (self::CRITERIA as $key) if ($review === null || $review->{$key} === null) return null;
        $tenths = array_sum(array_map(fn ($key) => (int) round(((float) $review->{$key}) * 10), self::CRITERIA));
        return $tenths / 6; // six scores in tenths, normalized onto 0–100
    }

    public static function average($reviews): ?float
    {
        $totals = $reviews->map(fn ($review) => self::total($review))->filter(fn ($value) => $value !== null);
        return $totals->isEmpty() ? null : $totals->avg();
    }

    public static function positions(string $division): array
    {
        return match (mb_strtolower(trim($division))) {
            'bph' => ['Ketua Umum', 'Wakil Ketua Umum', 'Sekretaris 1', 'Sekretaris 2', 'Bendahara 1', 'Bendahara 2'],
            'humas' => ['Ketua Divisi Humas', 'Wakil Ketua Divisi Humas', 'Sekretaris Divisi Humas', 'Staff Bidang Internal', 'Staff Bidang External'],
            'psdm' => ['Ketua Divisi PSDM', 'Wakil Divisi PSDM', 'Sekretaris Divisi PSDM', 'Staff Bidang Akademik', 'Staff Bidang Non-Akademik'],
            'kominfo' => ['Koordinator Kominfo', 'Wakil Koordinator Kominfo', 'Staff Media Growth', 'Staff Copywriting', 'Staff Kreatif & Desain', 'Staff Video Profile'],
            'kwu' => ['Ketua Divisi Kewirausahaan', 'Wakil Divisi KWU', 'Sekretaris Divisi KWU', 'Staff Bidang Kewirausahaan', 'Staff Bidang Kemitraan'],
            'ristek' => ['Ketua Divisi Riset & Teknologi', 'Wakil Divisi Ristek', 'Sekretaris Divisi Ristek', 'Staff Bidang Riset Keilmuan', 'Staff Bidang Pengembangan Teknologi'],
            default => ['Staff Divisi '.trim($division)],
        };
    }

    public function decide(User $actor, Oprec $oprec, OprecRegistration $registration, array $data): OprecRegistration
    {
        $this->superAdmin($actor, $oprec);
        abort_unless($registration->oprec_id === $oprec->id, 404);
        return DB::transaction(function () use ($actor, $oprec, $registration, $data) {
            $period = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            abort_if($period->pengumuman_published, 409, 'Keputusan terkunci setelah pengumuman dipublikasikan.');
            abort_unless($period->writtenTest()->whereHas('submissions', fn ($q) => $q->where('oprec_registration_id', $registration->id))->exists(), 404);
            $current = OprecRegistration::where('oprec_id', $period->id)->whereKey($registration->id)->lockForUpdate()->firstOrFail();
            $status = $data['status'];
            $divisionId = $status === 'accepted' ? (int) ($data['accepted_division_id'] ?? 0) : null;
            $position = $status === 'accepted' ? trim((string) ($data['accepted_position'] ?? '')) : null;
            if ($status === 'accepted') {
                if (!in_array($divisionId, array_map('intval', array_filter([$current->divisi_pilihan_1, $current->divisi_pilihan_2, $current->divisi_pilihan_3])), true)) {
                    throw ValidationException::withMessages(['accepted_division_id' => ['Divisi penerimaan harus termasuk pilihan peserta.']]);
                }
                $division = $period->divisions()->whereKey($divisionId)->first();
                if (!$division || !in_array($position, self::positions($division->nama), true)) {
                    throw ValidationException::withMessages(['accepted_position' => ['Jabatan penerimaan tidak tersedia pada divisi yang dipilih.']]);
                }
            }
            $before = [$current->status, $current->accepted_division_id, $current->accepted_position];
            $current->update(['status' => $status, 'accepted_division_id' => $divisionId, 'accepted_position' => $position]);
            if ($before !== [$status, $divisionId, $position]) {
                DB::table('oprec_assessment_decision_logs')->insert([
                    'oprec_registration_id' => $current->id, 'actor_id' => $actor->id,
                    'old_status' => $before[0], 'new_status' => $status,
                    'old_division_id' => $before[1], 'new_division_id' => $divisionId,
                    'old_position' => $before[2], 'new_position' => $position,
                    'created_at' => now(),
                ]);
            }
            return $current;
        });
    }
}
