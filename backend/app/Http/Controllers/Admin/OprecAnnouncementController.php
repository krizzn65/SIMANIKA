<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Services\OprecAnnouncementService;
use App\Services\OprecAssessmentService;
use App\Support\SearchSql;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OprecAnnouncementController extends Controller
{
    public function __construct(private OprecAnnouncementService $announcements) {}

    public function index(Request $request)
    {
        return response()->json([
            'data' => Oprec::select(['id', 'periode', 'pengumuman_published'])->orderByDesc('id')->get(),
            'can_manage' => in_array($request->user()->effectiveRole(), ['super_admin', 'admin'], true),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function show(Request $request, Oprec $oprec)
    {
        $request->validate(['page' => ['nullable', 'integer', 'min:1']]);
        $leader = $request->user()->effectiveRole() === 'leader';
        $canReadParticipants = !$leader || DB::table('oprec_assessment_assignments')
            ->where('oprec_id', $oprec->id)->where('user_id', $request->user()->id)->whereNull('revoked_at')->exists();
        $query = $this->announcements->participants($oprec)->where('status', 'accepted')
            ->select(['oprec_registrations.id', 'oprec_registrations.user_id', 'oprec_registrations.nim', 'oprec_registrations.form_data', 'oprec_registrations.accepted_division_id', 'oprec_registrations.accepted_position'])->with('user:id,name')
            ->leftJoin('oprec_divisions as accepted_divisions', function ($join) {
                $join->on('accepted_divisions.id', '=', 'oprec_registrations.accepted_division_id')
                    ->on('accepted_divisions.oprec_id', '=', 'oprec_registrations.oprec_id');
            });
        if (!$canReadParticipants) $query->whereRaw('1 = 0');
        $metadata = $this->announcements->metadata($oprec, true);
        if ($leader) unset($metadata['whatsapp_url']);
        $cases = []; $bindings = [];
        foreach (['bph', 'humas', 'psdm', 'kominfo', 'kwu', 'ristek'] as $division) {
            foreach (OprecAssessmentService::positions($division) as $rank => $position) {
                $cases[] = 'WHEN LOWER(TRIM(accepted_divisions.nama)) = ? AND oprec_registrations.accepted_position = ? THEN '.(int) $rank;
                array_push($bindings, $division, $position);
            }
        }
        $page = $query->orderByRaw("CASE LOWER(TRIM(accepted_divisions.nama)) WHEN 'bph' THEN 0 WHEN 'humas' THEN 1 WHEN 'psdm' THEN 2 WHEN 'kominfo' THEN 3 WHEN 'kwu' THEN 4 WHEN 'ristek' THEN 5 ELSE 6 END")
            ->orderByRaw('CASE '.implode(' ', $cases).' ELSE 99 END', $bindings)
            ->orderByRaw('LOWER(COALESCE('.SearchSql::text('oprec_registrations.form_data->nama').', '.SearchSql::text('oprec_registrations.form_data->nama_lengkap').", ''))")
            ->orderBy('oprec_registrations.id')->paginate(20);
        $divisions = $oprec->divisions()->pluck('nama', 'id');
        $page->setCollection($page->getCollection()->map(fn ($r) => [
            'id' => $r->id, 'name' => $r->form_data['nama'] ?? $r->form_data['nama_lengkap'] ?? $r->form_data['namaLengkap'] ?? $r->user?->name ?? 'Peserta',
            'nim' => $r->nim, 'division' => $divisions[$r->accepted_division_id] ?? '—',
            'position' => $r->accepted_position ?: 'Belum tercatat',
        ]));
        return response()->json([
            'period' => ['id' => $oprec->id, 'periode' => $oprec->periode],
            'announcement' => $metadata,
            'can_read_participants' => $canReadParticipants,
            'blockers' => $this->announcements->blockers($oprec),
            'participants' => $page, 'server_now' => now()->toIso8601String(),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function save(Request $request, Oprec $oprec)
    {
        $this->announcements->authorizeWriter($request->user());
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'], 'description' => ['required', 'string', 'max:2000'],
            'release_at' => ['required', 'date'],
            'whatsapp_url' => ['required', 'string', 'max:500', 'regex:~^https://chat\.whatsapp\.com/[a-zA-Z0-9]+(?:\?[^\s]*)?$~'],
            'poster' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);
        $newPath = null; $oldPath = null;
        try {
            $updated = DB::transaction(function () use ($request, $oprec, $data, &$newPath, &$oldPath) {
                $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
                abort_if($this->announcements->released($current), 409, 'Pengumuman yang sudah dirilis tidak dapat diubah.');
                $blockers = $this->announcements->blockers($current);
                if ($blockers) throw ValidationException::withMessages(['period' => $blockers]);
                $release = \Carbon\Carbon::parse($data['release_at']);
                if ($release->lt(now()->startOfMinute())) throw ValidationException::withMessages(['release_at' => ['Jadwal tidak boleh berada di masa lalu.']]);
                if (!$current->pengumuman_poster && !$request->hasFile('poster')) throw ValidationException::withMessages(['poster' => ['Pilih poster pengumuman.']]);
                if ($request->hasFile('poster')) {
                    $newPath = $request->file('poster')->store('oprec/announcements', 'local');
                    abort_unless($newPath, 503, 'Poster gagal disimpan. Coba lagi.');
                    $oldPath = $current->pengumuman_poster;
                }
                $current->forceFill([
                    'status' => 'closed', 'pengumuman_published' => true, 'pengumuman_tanggal' => $release,
                    'pengumuman_judul' => trim($data['title']), 'pengumuman_pesan' => trim($data['description']),
                    'pengumuman_grup_wa' => $data['whatsapp_url'],
                    'pengumuman_poster' => $newPath ?: $current->pengumuman_poster,
                ])->save();
                return $current;
            });
        } catch (\Throwable $e) {
            if ($newPath) Storage::disk('local')->delete($newPath);
            throw $e;
        }
        if ($oldPath && str_starts_with($oldPath, 'oprec/announcements/')) Storage::disk('local')->delete($oldPath);
        return response()->json(['data' => $this->announcements->metadata($updated, true)])->header('Cache-Control', 'private, no-store');
    }

    public function poster(Oprec $oprec)
    {
        abort_unless($oprec->pengumuman_poster && Storage::disk('local')->exists($oprec->pengumuman_poster), 404);
        return response()->file(Storage::disk('local')->path($oprec->pengumuman_poster), ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
