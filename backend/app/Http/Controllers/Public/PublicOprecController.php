<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\OprecResource;
use App\Models\Oprec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicOprecController extends Controller
{
    public function poster(string $filename)
    {
        abort_unless(preg_match('/^[a-zA-Z0-9._-]+\.(jpe?g|png|webp)$/i', $filename), 404);
        $path = 'oprec/posters/'.$filename;
        abort_unless(Storage::disk('public')->exists($path), 404);
        return response()->file(Storage::disk('public')->path($path), ['Cache-Control' => 'public, max-age=3600']);
    }

    public function index(Request $request)
    {
        $oprec = Oprec::with('divisions')->where('status', '!=', 'draft')->latest('created_at')->latest('id')->first();
        return response()->json(['data' => $oprec ? (new OprecResource($oprec))->resolve($request) : null], 200, ['Cache-Control' => 'no-store']);
    }

    public function result(Request $request, Oprec $oprec)
    {
        if ($oprec->pengumuman_judul) return app(OprecAnnouncementController::class)->verify($request, $oprec);
        if (is_string($request->input('nim'))) {
            $request->merge(['nim' => strtoupper(trim($request->input('nim')))]);
        }
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
