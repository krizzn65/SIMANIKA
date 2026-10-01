<?php

namespace App\Services;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;

class OprecAnnouncementService
{
    public const TICKET_SECONDS = 1800;

    public function released(Oprec $oprec): bool
    {
        return $oprec->status !== 'draft' && $oprec->pengumuman_published
            && (!$oprec->pengumuman_tanggal || $oprec->pengumuman_tanggal->lte(now()))
            && ($oprec->status === 'closed' || $oprec->tanggal_tutup?->lte(now()));
    }

    public function authorizeWriter(User $user): void
    {
        abort_unless(in_array($user->effectiveRole(), [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN], true), 403);
    }

    public function blockers(Oprec $oprec): array
    {
        $reasons = [];
        if (!$oprec->first_published_at) $reasons[] = 'Pendaftaran belum pernah dibuka.';
        if ($oprec->status === 'draft' || ($oprec->status !== 'closed' && !$oprec->tanggal_tutup?->lte(now()))) $reasons[] = 'Pendaftaran harus ditutup terlebih dahulu.';
        $stage = $oprec->writtenTest;
        if (!$stage || !$stage->published || !$stage->tanggal_tutup?->lte(now())) $reasons[] = 'Tes Tulis belum selesai.';
        $participants = $this->participants($oprec);
        if (!(clone $participants)->exists()) $reasons[] = 'Belum ada peserta yang mengirim Tes Tulis.';
        if ((clone $participants)->whereNotIn('status', ['accepted', 'rejected'])->exists()) $reasons[] = 'Putuskan Terima atau Tolak untuk seluruh pengirim Tes Tulis.';
        if ((clone $participants)->where('status', 'accepted')->where(function ($q) use ($oprec) {
            $q->whereNull('accepted_division_id')->orWhereNotIn('accepted_division_id', $oprec->divisions()->select('id'))->orWhereNull('accepted_position')->orWhereRaw("TRIM(accepted_position) = ''");
        })->exists()) $reasons[] = 'Lengkapi divisi dan jabatan penerimaan peserta yang diterima.';
        return $reasons;
    }

    public function participants(Oprec $oprec)
    {
        return $oprec->registrations()->whereIn('oprec_registrations.id', function ($query) use ($oprec) {
            $query->select('oprec_registration_id')->from('oprec_test_submissions')
                ->whereIn('oprec_stage_id', $oprec->writtenTest()->select('id'));
        });
    }

    public function metadata(Oprec $oprec, bool $admin = false): array
    {
        $released = $this->released($oprec);
        return [
            'exists' => (bool) $oprec->pengumuman_published,
            'title' => $oprec->pengumuman_judul ?: 'Pengumuman OPREC '.$oprec->periode,
            'release_at' => $oprec->pengumuman_tanggal?->toIso8601String(),
            'description' => ($admin || $released) ? ($oprec->pengumuman_pesan ?? '') : '',
            'released' => $released,
            'poster_url' => $oprec->pengumuman_poster && ($admin || $released)
                ? url('/api/'.($admin ? 'admin' : 'public')."/oprec/{$oprec->id}/announcement/poster") : null,
            ...($admin ? ['whatsapp_url' => $oprec->pengumuman_grup_wa ?? ''] : []),
        ];
    }

    public function ticket(Oprec $oprec, OprecRegistration $registration): string
    {
        return Crypt::encryptString(json_encode([
            'purpose' => 'oprec-result', 'period' => $oprec->id, 'registration' => $registration->id,
            'expires' => now()->timestamp + self::TICKET_SECONDS,
        ], JSON_THROW_ON_ERROR));
    }

    public function fromTicket(Oprec $oprec, string $ticket): OprecRegistration
    {
        try { $data = json_decode(Crypt::decryptString($ticket), true, 8, JSON_THROW_ON_ERROR); }
        catch (\Throwable) { abort(401, 'Verifikasi telah berakhir. Silakan periksa identitas kembali.'); }
        abort_unless(($data['purpose'] ?? '') === 'oprec-result' && ($data['period'] ?? null) === $oprec->id
            && is_int($data['expires'] ?? null) && $data['expires'] > now()->timestamp, 401);
        abort_unless($this->released($oprec), 409, 'Pengumuman belum tersedia.');
        return $this->participants($oprec)->whereKey($data['registration'] ?? 0)
            ->whereIn('status', ['accepted', 'rejected'])->firstOrFail();
    }
}
