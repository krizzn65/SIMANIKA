<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventEnrollmentController extends Controller
{
    public function __invoke(Request $request, Event $event)
    {
        $created = DB::transaction(function () use ($request, $event) {
            $locked = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'published' && $locked->tipe_pendaftaran === 'individu', 404);
            if (($locked->buka_pendaftaran && today()->lt($locked->buka_pendaftaran)) ||
                ($locked->deadline_pendaftaran && today()->gt($locked->deadline_pendaftaran)) ||
                ($locked->tanggal_selesai && today()->gt($locked->tanggal_selesai)) ||
                !$locked->formFields()->exists()) {
                abort(409, 'Pendaftaran event tidak tersedia.');
            }

            return DB::table('event_enrollments')->insertOrIgnore([
                'event_id' => $locked->id,
                'user_id' => $request->user()->getKey(),
                'created_at' => now(),
                'updated_at' => now(),
            ]) > 0;
        });

        return response()->json(['data' => ['enrolled' => true]], $created ? 201 : 200);
    }
}
