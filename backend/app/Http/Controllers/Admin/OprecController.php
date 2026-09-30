<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Oprec\SaveOprecRequest;
use App\Http\Resources\OprecResource;
use App\Models\Oprec;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OprecController extends Controller
{
    public function index() { return OprecResource::collection(Oprec::with('divisions')->latest()->paginate(20)); }
    public function show(Oprec $oprec) { return new OprecResource($oprec->load('divisions')); }

    public function uploadPoster(Request $request)
    {
        $field = $request->hasFile('logo') ? 'logo' : 'poster';
        $request->validate([$field => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120']]);
        $path = $request->file($field)->store('oprec/posters', 'public');
        return response()->json(['url' => route('public.oprec-poster', ['filename' => basename($path)])]);
    }

    public function uploadLogo(Request $request)
    {
        return $this->uploadPoster($request);
    }

    public function store(SaveOprecRequest $request)
    {
        $data = $request->validated();
        $oprec = DB::transaction(function () use ($data) {
            $attributes = $this->attributes($data);
            $attributes['pengumuman_published'] = false;
            $attributes['pengumuman_tanggal'] = null;
            $attributes['pengumuman_pesan'] = null;
            if ($data['status'] === 'open') $attributes['first_published_at'] = now();
            $oprec = Oprec::create($attributes);
            $this->syncDivisions($oprec, $data['divisi_tersedia'] ?? []);
            return $oprec;
        });
        return (new OprecResource($oprec->load('divisions')))->response()->setStatusCode(201);
    }

    public function update(SaveOprecRequest $request, Oprec $oprec)
    {
        $data = $request->validated();
        $updated = DB::transaction(function () use ($oprec, $data) {
            $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            if ($current->pengumuman_published && $data['status'] !== 'closed') throw ValidationException::withMessages(['status' => ['Pendaftaran tetap ditutup setelah pengumuman dijadwalkan.']]);
            $currentDivisions = $current->divisions()->get()->map(fn ($division) => [
                'nama' => $division->nama, 'nama_lengkap' => $division->nama_lengkap,
                'deskripsi' => $division->deskripsi, 'logo' => $division->logo, 'jabatan' => $division->jabatan ?? [],
            ])->all();
            $incomingDivisions = collect($data['divisi_tersedia'] ?? [])->map(fn ($division) => [
                'nama' => $division['nama'], 'nama_lengkap' => $division['nama_lengkap'] ?? null,
                'deskripsi' => $division['deskripsi'] ?? null, 'logo' => $division['logo'] ?? null,
                'jabatan' => $division['jabatan'] ?? [],
            ])->all();
            $divisionsChanged = array_key_exists('divisi_tersedia', $data) && $incomingDivisions !== $currentDivisions;
            if ($current->registrations()->exists()) {
                if ($current->schema_version === $data['schema_version'] && $current->form_fields !== $data['form_fields']) throw ValidationException::withMessages(['schema_version' => ['Naikkan versi skema saat mengubah kolom.']]);
                if ($divisionsChanged) throw ValidationException::withMessages(['divisi_tersedia' => ['Divisi tidak boleh diubah setelah ada pendaftar.']]);
            }
            $attributes = $this->attributes($data);
            unset($attributes['pengumuman_published'], $attributes['pengumuman_tanggal'], $attributes['pengumuman_pesan']);
            if ($data['status'] === 'open' && !$current->first_published_at) $attributes['first_published_at'] = now();
            $current->update($attributes);
            if ($divisionsChanged) $this->syncDivisions($current, $data['divisi_tersedia']);
            return $current;
        });
        return new OprecResource($updated->fresh('divisions'));
    }

    public function destroy(Oprec $oprec)
    {
        $deleted = DB::transaction(function () use ($oprec) {
            $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            if ($current->registrations()->exists()) return false;
            $current->delete();
            return true;
        });
        if (!$deleted) return response()->json(['message' => 'Pendaftaran tidak dapat dihapus karena sudah memiliki berkas pendaftar.'], 409);
        return response()->noContent();
    }

    private function attributes(array $data): array
    {
        $announcement = $data['pengumuman'];
        unset($data['pengumuman'], $data['divisi_tersedia']);
        return array_merge($data, ['pengumuman_published' => $announcement['published'], 'pengumuman_tanggal' => $announcement['tanggal'] ?? null, 'pengumuman_pesan' => $announcement['pesan'] ?? null]);
    }

    private function syncDivisions(Oprec $oprec, array $divisions): void
    {
        $oprec->divisions()->delete();
        foreach ($divisions as $index => $division) $oprec->divisions()->create(array_merge($division, ['sort_order' => $index]));
    }
}
