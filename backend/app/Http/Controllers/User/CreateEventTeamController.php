<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateEventTeamController extends Controller
{
    public function __invoke(Request $request, Event $event)
    {
        abort_unless($event->tipe_pendaftaran === 'tim' && $event->status === 'published', 404);

        $data = $request->validate([
            'nama_tim' => ['required', 'string', 'max:100'],
        ]);

        try {
            $team = DB::transaction(function () use ($event, $request, $data) {
                $locked = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
                $this->ensureRegistrationIsAvailable($locked);

                if (DB::table('team_members')->where('event_id', $locked->id)->where('user_id', $request->user()->id)->exists()) {
                    throw ValidationException::withMessages(['nama_tim' => ['Kamu sudah tergabung dalam tim competition ini.']]);
                }

                $number = $locked->last_team_number + 1;
                $locked->last_team_number = $number;
                $locked->save();

                $team = $locked->teams()->create([
                    'kode_unik' => ($locked->kode_prefix ?: 'TEAM').str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                    'nama_tim' => trim($data['nama_tim']),
                    'ketua_id' => $request->user()->id,
                    'jumlah_anggota' => 1,
                    'completion_status' => ($locked->min_anggota ?? 1) <= 1 ? 'complete' : 'incomplete',
                    'form_data' => [],
                ]);

                DB::table('team_members')->insert([
                    'team_id' => $team->id,
                    'event_id' => $locked->id,
                    'user_id' => $request->user()->id,
                    'joined_at' => now(),
                ]);

                DB::table('event_enrollments')->insertOrIgnore([
                    'event_id' => $locked->id,
                    'user_id' => $request->user()->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return $team;
            });
        } catch (UniqueConstraintViolationException $error) {
            return response()->json(['message' => 'Kamu sudah tergabung dalam tim competition ini.'], 409);
        }

        return response()->json(['data' => [
            'created' => true,
            'teamName' => $team->nama_tim,
            'teamCode' => $team->kode_unik,
        ]], 201);
    }

    private function ensureRegistrationIsAvailable(Event $event): void
    {
        if ($event->tipe_pendaftaran !== 'tim' ||
            $event->status !== 'published' ||
            ($event->buka_pendaftaran && today()->lt($event->buka_pendaftaran)) ||
            ($event->deadline_pendaftaran && today()->gt($event->deadline_pendaftaran)) ||
            ($event->tanggal_selesai && today()->gt($event->tanggal_selesai)) ||
            !$event->formFields()->exists()) {
            throw ValidationException::withMessages(['nama_tim' => ['Pendaftaran tim belum tersedia atau sudah ditutup.']]);
        }
    }
}
