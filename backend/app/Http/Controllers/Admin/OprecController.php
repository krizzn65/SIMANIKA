<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Oprec\SaveOprecRequest;
use App\Http\Resources\OprecResource;
use App\Models\Oprec;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OprecController extends Controller
{
    public function index() { return OprecResource::collection(Oprec::with('divisions')->latest()->paginate(20)); }

    public function store(SaveOprecRequest $request)
    {
        $data = $request->validated();
        $oprec = DB::transaction(function () use ($data) {
            $oprec = Oprec::create($this->attributes($data));
            $this->syncDivisions($oprec, $data['divisi_tersedia'] ?? []);
            return $oprec;
        });
        return (new OprecResource($oprec->load('divisions')))->response()->setStatusCode(201);
    }

    public function update(SaveOprecRequest $request, Oprec $oprec)
    {
        $data = $request->validated();
        if ($oprec->registrations()->exists()) {
            if ($oprec->schema_version === $data['schema_version'] && $oprec->form_fields !== $data['form_fields']) throw ValidationException::withMessages(['schema_version' => ['Naikkan versi skema saat mengubah kolom.']]);
            if (array_key_exists('divisi_tersedia', $data)) throw ValidationException::withMessages(['divisi_tersedia' => ['Divisi tidak boleh diubah setelah ada pendaftar.']]);
        }
        DB::transaction(function () use ($oprec, $data) {
            $oprec->update($this->attributes($data));
            if (array_key_exists('divisi_tersedia', $data)) $this->syncDivisions($oprec, $data['divisi_tersedia']);
        });
        return new OprecResource($oprec->fresh('divisions'));
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
