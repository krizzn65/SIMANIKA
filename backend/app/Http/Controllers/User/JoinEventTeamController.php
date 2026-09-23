<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Team;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JoinEventTeamController extends Controller
{
    public function __invoke(Request $request, Event $event)
    {
        abort_unless($event->tipe_pendaftaran === 'tim' && $event->status === 'published', 404);
        $data = $request->validate(['kode_unik' => ['required', 'string', 'max:16', 'regex:/^[A-Z0-9]+$/']]);
        try {
            DB::transaction(function () use ($event, $request, $data) {
                $lockedEvent = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
                if ($lockedEvent->status !== 'published' ||
                    ($lockedEvent->buka_pendaftaran && today()->lt($lockedEvent->buka_pendaftaran)) ||
                    ($lockedEvent->deadline_pendaftaran && today()->gt($lockedEvent->deadline_pendaftaran)) ||
                    ($lockedEvent->tanggal_selesai && today()->gt($lockedEvent->tanggal_selesai))) {
                    throw ValidationException::withMessages(['kode_unik' => ['Pendaftaran tim sudah ditutup.']]);
                }
                if (DB::table('team_members')->where('event_id', $event->id)->where('user_id', $request->user()->id)->exists()) {
                    throw ValidationException::withMessages(['kode_unik' => ['Kamu sudah bergabung dalam tim event ini.']]);
                }
                $team = Team::where('event_id', $event->id)->where('kode_unik', $data['kode_unik'])->lockForUpdate()->first();
                if (!$team) throw ValidationException::withMessages(['kode_unik' => ['Kode tim tidak ditemukan.']]);
                if ($team->jumlah_anggota >= $lockedEvent->max_anggota) {
                    throw ValidationException::withMessages(['kode_unik' => ['Tim sudah penuh.']]);
                }
                DB::table('team_members')->insert([
                    'team_id' => $team->id, 'event_id' => $event->id,
                    'user_id' => $request->user()->id, 'joined_at' => now(),
                ]);
                $team->jumlah_anggota++;
                $team->completion_status = $team->jumlah_anggota >= $lockedEvent->min_anggota ? 'complete' : 'incomplete';
                $team->save();
            });
        } catch (UniqueConstraintViolationException $error) {
            return response()->json(['message' => 'Kamu sudah bergabung dalam tim event ini.'], 409);
        }
        return response()->json(['data' => ['joined' => true]]);
    }
}
