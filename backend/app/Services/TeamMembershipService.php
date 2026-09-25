<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Team;
use App\Support\EventTimeline;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeamMembershipService
{
    public function lockReason(Event $event, ?Team $team = null): ?string
    {
        if ($team?->review_status === 'accepted') return 'Tim sudah diterima penyelenggara. Susunan anggota dikunci.';
        if (!EventTimeline::isOpen($event)) {
            return 'Periode pendaftaran tidak aktif. Perubahan tim dan formulir ditutup.';
        }
        return null;
    }

    public function ensureOpen(Event $event, ?Team $team = null): void
    {
        if ($reason = $this->lockReason($event, $team)) throw ValidationException::withMessages(['team' => [$reason]]);
    }

    public function requestJoin(Event $event, int $userId, string $code): void
    {
        DB::transaction(function () use ($event, $userId, $code) {
            $event = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
            abort_unless($event->tipe_pendaftaran === 'tim', 404);
            $this->ensureOpen($event);
            if (!$event->formFields()->exists()) $this->invalid('Formulir event belum tersedia.');
            $team = $event->teams()->where('kode_unik', $code)->lockForUpdate()->first();
            if (!$team) $this->invalid('Kode tim tidak ditemukan.');
            $this->ensureOpen($event, $team);
            $existing = DB::table('team_members')->where('event_id', $event->id)->where('user_id', $userId)->first();
            if ($existing) {
                if ((int) $existing->team_id === $team->id && $existing->status === 'pending') return;
                $this->invalid('Kamu sudah menjadi anggota atau memiliki permintaan bergabung pada event ini.');
            }
            if ($team->members()->count() >= $event->max_anggota) $this->invalid('Tim sudah penuh.');
            DB::table('team_members')->insert([
                'team_id' => $team->id, 'event_id' => $event->id, 'user_id' => $userId,
                'status' => 'pending', 'joined_at' => now(),
            ]);
            DB::table('event_enrollments')->insertOrIgnore([
                'event_id' => $event->id, 'user_id' => $userId, 'created_at' => now(), 'updated_at' => now(),
            ]);
        });
    }

    public function manage(Event $event, int $teamId, int $actorId, int $memberId, string $action): void
    {
        DB::transaction(function () use ($event, $teamId, $actorId, $memberId, $action) {
            // All roster mutations lock event before team, matching create/join/form submission.
            $event = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
            $team = $event->teams()->whereKey($teamId)->lockForUpdate()->firstOrFail();
            abort_unless((int) $team->ketua_id === $actorId, 403, 'Hanya ketua tim yang dapat mengelola anggota.');
            $this->ensureOpen($event, $team);
            if ((int) $team->ketua_id === $memberId) $this->invalid('Ketua tim tidak dapat dihapus.');
            $query = DB::table('team_members')->where('team_id', $team->id)->where('user_id', $memberId);
            $member = (clone $query)->first();
            abort_unless($member, 404);
            if ($action === 'accept') {
                if ($member->status !== 'pending') $this->invalid('Anggota ini sudah disetujui.');
                if ($team->members()->count() >= $event->max_anggota) $this->invalid('Tim sudah penuh. Tidak ada slot untuk anggota baru.');
                $query->update(['status' => 'accepted', 'joined_at' => now()]);
            } else {
                $query->delete();
                DB::table('event_enrollments')->where('event_id', $event->id)->where('user_id', $memberId)->delete();
            }
            $count = $team->members()->count();
            $team->update(['jumlah_anggota' => $count,
                'completion_status' => $count >= ($event->min_anggota ?? 1) ? 'complete' : 'incomplete']);
        });
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['team' => [$message]]);
    }
}
