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
        $userId = $request->user()->getKey();
        $oprecId = $request->input('oprec_id');

        $oprec = $oprecId
            ? Oprec::find($oprecId)
            : Oprec::where('status', 'open')->first();

        abort_unless($oprec && $oprec->status === 'open', 404, 'OPREC tidak ditemukan atau belum dibuka.');

        // If user already submitted registration
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
    }
}
