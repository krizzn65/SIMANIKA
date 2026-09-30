<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Services\OprecAnnouncementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OprecAnnouncementController extends Controller
{
    public function __construct(private OprecAnnouncementService $announcements) {}

    public function show(Oprec $oprec)
    {
        abort_unless($oprec->pengumuman_published && $oprec->status !== 'draft', 404);
        return response()->json(['data' => $this->announcements->metadata($oprec), 'server_now' => now()->toIso8601String()])
            ->header('Cache-Control', 'no-store');
    }

    public function verify(Request $request, Oprec $oprec)
    {
        abort_unless($this->announcements->released($oprec), 409, 'Pengumuman belum tersedia.');
        if (is_string($request->input('nim'))) $request->merge(['nim' => strtoupper(trim($request->input('nim')))]);
        $data = $request->validate([
            'nim' => ['required', 'string', 'regex:/^E31[A-Z0-9.\-]{0,29}$/'],
            'tanggal_lahir' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
        ]);
        $registration = $this->announcements->participants($oprec)->where('nim', $data['nim'])
            ->whereDate('tanggal_lahir', $data['tanggal_lahir'])->whereIn('status', ['accepted', 'rejected'])->first();
        if (!$registration) return response()->json(['message' => 'Data tidak ditemukan. Periksa NIM dan tanggal lahir sesuai pendaftaran.'], 404)
            ->header('Cache-Control', 'private, no-store');
        return response()->json(['ticket' => $this->announcements->ticket($oprec, $registration), 'expires_in' => OprecAnnouncementService::TICKET_SECONDS])
            ->header('Cache-Control', 'private, no-store');
    }

    public function result(Request $request, Oprec $oprec)
    {
        $data = $request->validate(['ticket' => ['required', 'string', 'max:4096']]);
        $registration = $this->announcements->fromTicket($oprec, $data['ticket']);
        $accepted = $registration->status === 'accepted';
        return response()->json(['data' => [
            'status' => $registration->status, 'period' => $oprec->periode,
            'name' => $registration->form_data['nama'] ?? $registration->form_data['nama_lengkap'] ?? $registration->form_data['namaLengkap'] ?? $registration->user?->name ?? 'Peserta',
            'nim' => $registration->nim,
            'division' => $accepted ? $oprec->divisions()->whereKey($registration->accepted_division_id)->value('nama') : null,
            'position' => $accepted ? $registration->accepted_position : null,
            'whatsapp_url' => $accepted ? $oprec->pengumuman_grup_wa : null,
        ]])->header('Cache-Control', 'private, no-store')->header('X-Robots-Tag', 'noindex, nofollow');
    }

    public function poster(Oprec $oprec)
    {
        abort_unless($this->announcements->released($oprec) && $oprec->pengumuman_poster
            && Storage::disk('local')->exists($oprec->pengumuman_poster), 404);
        return response()->file(Storage::disk('local')->path($oprec->pengumuman_poster), [
            'Cache-Control' => 'public, max-age=3600', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
