<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OprecRegistrantController extends Controller
{
    public function index(Request $request, Oprec $oprec)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'division' => ['nullable', 'integer', 'min:1'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $query = $oprec->registrations()->with('user:id,email,name');
        $search = trim($filters['search'] ?? '');
        if ($search !== '') {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower($search));
            $pattern = "%{$escaped}%";
            $query->where(function ($query) use ($pattern) {
                $query->whereRaw("LOWER(nim) LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'nama') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'nama_lengkap') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'namaLengkap') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereHas('user', function ($user) use ($pattern) {
                        $user->whereRaw("LOWER(name) LIKE ? ESCAPE '\\'", [$pattern])
                            ->orWhereRaw("LOWER(email) LIKE ? ESCAPE '\\'", [$pattern]);
                    });
            });
        }
        if (isset($filters['division'])) {
            $divisionId = (int) $filters['division'];
            $query->where(function ($query) use ($divisionId) {
                $query->where('divisi_pilihan_1', $divisionId)
                    ->orWhere('divisi_pilihan_2', $divisionId)
                    ->orWhere('divisi_pilihan_3', $divisionId);
            });
        }
        return response()->json($query->orderByDesc('created_at')->orderByDesc('id')->paginate(20)->through(function ($item) use ($oprec) {
            $formData = $item->form_data ?? [];
            $formName = $formData['nama'] ?? $formData['nama_lengkap'] ?? $formData['namaLengkap'] ?? null;
            $fileUploads = [];
            if (is_array($item->file_uploads)) {
                foreach ($item->file_uploads as $key => $path) {
                    if (is_string($path) && $path !== '') {
                        $fileUploads[$key] = [
                            'field' => $key,
                            'downloadUrl' => url("/api/admin/oprec/{$oprec->id}/registrants/{$item->id}/files/".rawurlencode($key)),
                        ];
                    }
                }
            }
            return [
                'id' => $item->id,
                'user' => $item->user,
                'name' => (is_string($formName) && trim($formName) !== '') ? trim($formName) : ($item->user?->name ?? 'Peserta'),
                'nim' => $item->nim,
                'tanggalLahir' => $item->tanggal_lahir?->format('Y-m-d'),
                'formData' => $formData,
                'fileUploads' => $fileUploads,
                'divisiPilihan1' => $item->divisi_pilihan_1,
                'divisiPilihan2' => $item->divisi_pilihan_2,
                'divisiPilihan3' => $item->divisi_pilihan_3,
                'createdAt' => $item->created_at?->toIso8601String(),
            ];
        }));
    }

    public function update(Request $request, Oprec $oprec, OprecRegistration $registration)
    {
        abort_unless($registration->oprec_id === $oprec->id, 404);
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'accepted', 'rejected'])],
            'accepted_division_id' => ['nullable', 'integer'],
            'catatan' => ['nullable', 'string', 'max:2000'],
        ]);
        if ($data['status'] === 'accepted' && (empty($data['accepted_division_id']) || !$oprec->divisions()->whereKey($data['accepted_division_id'])->exists())) {
            throw ValidationException::withMessages(['accepted_division_id' => ['Pilih divisi yang tersedia.']]);
        }
        if ($data['status'] === 'accepted' && !in_array((int) $data['accepted_division_id'], array_filter([(int) $registration->divisi_pilihan_1, (int) $registration->divisi_pilihan_2, (int) $registration->divisi_pilihan_3]), true)) {
            throw ValidationException::withMessages(['accepted_division_id' => ['Divisi penerimaan harus termasuk pilihan peserta.']]);
        }
        $registration->update([
            'status' => $data['status'],
            'accepted_division_id' => $data['status'] === 'accepted' ? $data['accepted_division_id'] : null,
            'catatan' => $data['catatan'] ?? null,
        ]);
        return response()->json(['data' => ['id' => $registration->id, 'status' => $registration->status]]);
    }

    public function download(Oprec $oprec, OprecRegistration $registration, string $field)
    {
        abort_unless($registration->oprec_id === $oprec->id && preg_match('/^[a-z][a-z0-9_]{0,49}$/', $field), 404);
        $path = $registration->file_uploads[$field] ?? null;
        abort_unless(is_string($path) && str_starts_with($path, "oprec/{$oprec->id}/") && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, "oprec-{$registration->id}-{$field}", ['Cache-Control' => 'private, no-store']);
    }
}
