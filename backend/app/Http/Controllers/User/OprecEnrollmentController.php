<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OprecEnrollmentController extends Controller
{
    public function __invoke(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $userId = $request->user()->getKey();
            $data = $request->validate(['oprec_id' => ['required', 'integer', 'exists:oprecs,id']]);
            $oprec = Oprec::withCount('divisions')->where('status', '!=', 'draft')
                ->latest('created_at')->latest('id')->lockForUpdate()->first();
            abort_unless($oprec && $oprec->id === (int) $data['oprec_id'], 404, 'OPREC tidak ditemukan.');
            if ($oprec->status !== 'open' || !$oprec->tanggal_buka || !$oprec->tanggal_tutup
                || now()->lt($oprec->tanggal_buka) || now()->gte($oprec->tanggal_tutup)
                || $oprec->divisions_count < 3) {
                return response()->json(['message' => 'Pendaftaran belum dibuka atau sudah ditutup.'], 409);
            }

            $alreadySubmitted = OprecRegistration::where('oprec_id', $oprec->id)
                ->where('user_id', $userId)
                ->exists();

            if ($alreadySubmitted) {
                return response()->json([
                    'data' => [
                        'enrolled' => true,
                        'alreadySubmitted' => true,
                        'oprecId' => $oprec->id,
                    ],
                ]);
            }

            $created = DB::table('oprec_enrollments')->insertOrIgnore([
                'oprec_id' => $oprec->id,
                'user_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]) > 0;

            return response()->json([
                'data' => [
                    'enrolled' => true,
                    'alreadySubmitted' => false,
                    'oprecId' => $oprec->id,
                ],
            ], $created ? 201 : 200);
        });
    }
}
