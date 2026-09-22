<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\OprecResource;
use App\Models\Oprec;
use Illuminate\Http\Request;

class PublicOprecController extends Controller
{
    public function index(Request $request)
    {
        $oprec = Oprec::with('divisions')->latest('created_at')->first();
        return response()->json(['data' => $oprec ? (new OprecResource($oprec))->resolve($request) : null], 200, ['Cache-Control' => 'no-store']);
    }

    public function result(Request $request, Oprec $oprec)
    {
        $data = $request->validate(['nim' => ['required', 'string', 'regex:/^[a-zA-Z0-9.\-]{3,32}$/'], 'tanggal_lahir' => ['required', 'date_format:Y-m-d', 'before_or_equal:today']]);
        $published = $oprec->pengumuman_published && (!$oprec->pengumuman_tanggal || $oprec->pengumuman_tanggal->isPast());
        $closed = $oprec->status === 'closed' || ($oprec->tanggal_tutup && $oprec->tanggal_tutup->isPast());
        if (!$published || !$closed) return response()->json(['message' => 'Pengumuman belum tersedia.'], 409, ['Cache-Control' => 'private, no-store']);
        $registration = $oprec->registrations()->where('nim', $data['nim'])->whereDate('tanggal_lahir', $data['tanggal_lahir'])->first();
        $status = $registration?->status ?? 'not_found';
        $division = $status === 'accepted' ? $oprec->divisions()->whereKey($registration->accepted_division_id ?? $registration->divisi_pilihan_1)->value('nama') : null;
        return response()->json(['data' => ['status' => $status, 'divisi' => $division ?? '', 'pesan' => $registration ? ($oprec->pengumuman_pesan ?? '') : '']], 200, ['Cache-Control' => 'private, no-store']);
    }
}
