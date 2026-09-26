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
    public function index(Oprec $oprec)
    {
        return response()->json($oprec->registrations()->with('user:id,email,name')->latest()->paginate(20)->through(fn ($item) => [
            'id' => $item->id, 'user' => $item->user, 'nim' => $item->nim,
            'formData' => $item->form_data, 'status' => $item->status,
            'divisiPilihan1' => $item->divisi_pilihan_1, 'divisiPilihan2' => $item->divisi_pilihan_2, 'divisiPilihan3' => $item->divisi_pilihan_3,
            'acceptedDivisionId' => $item->accepted_division_id, 'catatan' => $item->catatan,
            'createdAt' => $item->created_at?->toIso8601String(),
        ]));
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
