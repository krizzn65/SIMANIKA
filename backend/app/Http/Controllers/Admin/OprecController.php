<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Oprec\SaveOprecRequest;
use App\Http\Resources\OprecResource;
use App\Models\Oprec;
use App\Models\OprecDivision;
use App\Support\OprecSchema;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OprecController extends Controller
{
    public function index() { return OprecResource::collection(Oprec::with('divisions')->latest()->paginate(20)); }
    public function show(Oprec $oprec) { return new OprecResource($oprec->load('divisions')); }

    public function uploadPoster(Request $request)
    {
        $field = $request->hasFile('logo') ? 'logo' : 'poster';
        $request->validate([$field => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120']]);
        $path = $this->storeCompressedImage($request->file($field), 'oprec/posters')
            ?? $request->file($field)->store('oprec/posters', 'public');
        if (!$path) return response()->json(['message' => 'Berkas tidak dapat disimpan. Periksa izin storage hosting.'], 507);
        return response()->json(['url' => route('public.oprec-poster', ['filename' => basename($path)])]);
    }

    /**
     * Posters are shown on the public site; phone photos and exports are often
     * several MB. Re-encode to WebP at most 1400px wide so the page loads fast.
     * Returns null (caller keeps the original) when GD cannot handle the file.
     */
    private function storeCompressedImage(\Illuminate\Http\UploadedFile $file, string $dir): ?string
    {
        if (!function_exists('imagewebp') || !($source = @imagecreatefromstring((string) file_get_contents($file->getRealPath())))) return null;
        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min(1, 1400 / max(1, $width));
        $image = $source;
        if ($scale < 1) {
            $image = imagecreatetruecolor((int) round($width * $scale), (int) round($height * $scale));
            imagealphablending($image, false);
            imagesavealpha($image, true);
            imagecopyresampled($image, $source, 0, 0, 0, 0, imagesx($image), imagesy($image), $width, $height);
            imagedestroy($source);
        }
        ob_start();
        $ok = imagewebp($image, null, 82);
        $data = ob_get_clean();
        imagedestroy($image);
        if (!$ok || !$data || strlen($data) >= $file->getSize()) return null;
        $path = $dir.'/'.Str::random(40).'.webp';
        return Storage::disk('public')->put($path, $data) ? $path : null;
    }

    public function uploadGuidebook(Request $request)
    {
        $request->validate(['guidebook' => ['required', 'file', 'mimes:pdf', 'max:10240']]);
        $path = $request->file('guidebook')->store('oprec/guidebooks', 'local');
        return response()->json(['data' => ['path' => $path]], 201);
    }

    public function uploadQuestionExample(Request $request)
    {
        $request->validate(['example' => ['required', 'file', 'mimes:pdf', 'max:5120']]);
        $file = $request->file('example');
        $path = $file->store('oprec/question-examples', 'local');
        return response()->json([
            'data' => [
                'path' => $path,
                'filename' => $file->getClientOriginalName(),
            ]
        ], 201);
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
        $oldFiles = collect([$oprec->guidebook, ...collect($oprec->form_fields ?? [])->pluck('example_file')])->filter()->unique();
        $updated = DB::transaction(function () use ($oprec, $data) {
            $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            if ($current->pengumuman_published && $data['status'] !== 'closed') throw ValidationException::withMessages(['status' => ['Pendaftaran tetap ditutup setelah pengumuman dijadwalkan.']]);
            if ($current->pengumuman_published && !OprecSchema::same($current->form_fields, $data['form_fields'])) {
                throw ValidationException::withMessages(['form_fields' => ['Formulir terkunci setelah pengumuman dijadwalkan.']]);
            }
            $currentDivisions = $current->divisions()->get()->map(fn ($division) => [
                'nama' => $division->nama, 'nama_lengkap' => $division->nama_lengkap,
                'deskripsi' => $division->deskripsi, 'logo' => $division->logo, 'jabatan' => $division->jabatan ?? [],
            ])->all();
            $incomingDivisions = collect($data['divisi_tersedia'] ?? [])->map(fn ($division) => [
                'nama' => $division['nama'], 'nama_lengkap' => $division['nama_lengkap'] ?? null,
                'deskripsi' => $division['deskripsi'] ?? null, 'logo' => $division['logo'] ?? null,
                'jabatan' => OprecDivision::defaultJabatan($division['nama']),
            ])->all();
            $divisionsChanged = array_key_exists('divisi_tersedia', $data) && $incomingDivisions !== $currentDivisions;
            if ($current->registrations()->exists()) {
                if ($current->schema_version === $data['schema_version'] && !OprecSchema::same($current->form_fields, $data['form_fields'])) throw ValidationException::withMessages(['schema_version' => ['Naikkan versi skema saat mengubah kolom.']]);
                if ($divisionsChanged) throw ValidationException::withMessages(['divisi_tersedia' => ['Divisi tidak boleh diubah setelah ada pendaftar.']]);
            }
            $attributes = $this->attributes($data);
            unset($attributes['pengumuman_published'], $attributes['pengumuman_tanggal'], $attributes['pengumuman_pesan']);
            if ($data['status'] === 'open' && !$current->first_published_at) $attributes['first_published_at'] = now();
            $current->update($attributes);
            if ($divisionsChanged) $this->syncDivisions($current, $data['divisi_tersedia']);
            return $current;
        });
        $newFiles = collect([$updated->guidebook, ...collect($updated->form_fields ?? [])->pluck('example_file')])->filter()->unique();
        $oldFiles->diff($newFiles)->each(fn ($path) => Storage::disk('local')->delete($path));
        return new OprecResource($updated->fresh('divisions'));
    }

    public function destroy(Oprec $oprec)
    {
        $guidebook = $oprec->guidebook;
        $exampleFiles = collect($oprec->form_fields ?? [])->pluck('example_file')->filter();
        $deleted = DB::transaction(function () use ($oprec) {
            $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            if ($current->registrations()->exists()) return false;
            $current->delete();
            return true;
        });
        if (!$deleted) return response()->json(['message' => 'Pendaftaran tidak dapat dihapus karena sudah memiliki berkas pendaftar.'], 409);
        if ($guidebook) Storage::disk('local')->delete($guidebook);
        $exampleFiles->each(fn ($path) => Storage::disk('local')->delete($path));
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
        foreach ($divisions as $index => $division) $oprec->divisions()->create(array_merge($division, ['jabatan' => OprecDivision::defaultJabatan($division['nama']), 'sort_order' => $index]));
    }
}
