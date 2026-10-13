<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\OprecTestSubmission;
use Illuminate\Database\UniqueConstraintViolationException;
use App\Services\OprecAssessmentService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
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

    public function update(Request $request, Oprec $oprec, OprecRegistration $registration, OprecAssessmentService $assessment)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['accepted', 'rejected'])],
            'accepted_division_id' => ['nullable', 'integer'],
            'accepted_position' => ['required_if:status,accepted', 'nullable', 'string', 'max:150'],
        ]);
        $updated = $assessment->decide($request->user(), $oprec, $registration, $data);
        return response()->json(['data' => ['id' => $updated->id, 'status' => $updated->status]]);
    }

    /**
     * Admin-only correction of submitted form values. Uploaded documents are
     * intentionally excluded: replacing a private document is a separate,
     * auditable workflow and must never happen through a JSON request.
     */
    public function updateForm(Request $request, Oprec $oprec, OprecRegistration $registration)
    {
        abort_unless($registration->oprec_id === $oprec->id, 404);
        $head = $request->validate(['schema_version' => ['required', 'string', 'max:20']]);
        if ($head['schema_version'] !== $oprec->schema_version) {
            return response()->json(['message' => 'Formulir telah berubah. Muat ulang halaman sebelum menyimpan.'], 409);
        }

        $oprec->load('divisions');
        $fields = $oprec->form_fields ?? [];
        if (!count($fields) || count($fields) > 40) {
            return response()->json(['message' => 'Formulir tidak tersedia.'], 409);
        }

        $chosenDivisionIds = array_map('strval', [
            $request->input('divisi_pilihan_1'),
            $request->input('divisi_pilihan_2'),
            $request->input('divisi_pilihan_3'),
        ]);
        $chosenDivisions = $oprec->divisions->whereIn('id', array_map('intval', $chosenDivisionIds));
        $chosenDivisionNames = $chosenDivisions->pluck('nama')->map(fn ($name) => strtolower(trim((string) $name)))->all();
        $chosenDivisionFullNames = $chosenDivisions->pluck('nama_lengkap')->filter()->map(fn ($name) => strtolower(trim((string) $name)))->all();

        $rules = [];
        $inactiveTargetFields = [];
        foreach ($fields as $field) {
            $name = $field['name'] ?? '';
            $type = $field['type'] ?? '';
            if (!preg_match('/^[a-z][a-z0-9_]{0,49}$/', $name)
                || in_array($name, ['oprec_id', 'schema_version'], true)
                || !in_array($type, ['text', 'email', 'tel', 'url', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'], true)) {
                return response()->json(['message' => 'Skema formulir tidak valid.'], 503);
            }

            // Existing uploads stay untouched when editing answers.
            if ($type === 'file') {
                continue;
            }

            $isTargeted = ($field['target_type'] ?? 'all') === 'specific' && count((array) ($field['target_divisions'] ?? [])) > 0;
            $matchesDivision = !$isTargeted;
            if ($isTargeted) {
                foreach ((array) $field['target_divisions'] as $targetDivision) {
                    $target = strtolower(trim((string) $targetDivision));
                    if (in_array((string) $targetDivision, $chosenDivisionIds, true)
                        || in_array($target, $chosenDivisionNames, true)
                        || in_array($target, $chosenDivisionFullNames, true)) {
                        $matchesDivision = true;
                        break;
                    }
                }
            }
            if (!$matchesDivision) {
                $inactiveTargetFields[] = $name;
                continue;
            }

            $rules[$name] = [!empty($field['required']) ? 'required' : 'nullable'];
            if ($type === 'checkbox') {
                $rules[$name][] = Rule::in(['on']);
                continue;
            }
            $rules[$name][] = 'string';
            if ($type !== 'number') {
                $rules[$name][] = 'max:'.min(5000, max(1, (int) ($field['maxLength'] ?? ($type === 'textarea' ? 3000 : 255))));
            }
            if ($type === 'email') $rules[$name][] = 'email';
            if ($type === 'url') $rules[$name][] = 'url:http,https';
            if ($type === 'date') $rules[$name][] = 'date_format:Y-m-d';
            if ($type === 'number') {
                $rules[$name][] = 'numeric';
                if (isset($field['min'])) $rules[$name][] = 'min:'.$field['min'];
                if (isset($field['max'])) $rules[$name][] = 'max:'.$field['max'];
            }
            if ($type === 'tel') $rules[$name][] = 'regex:/^[0-9+() .-]{5,30}$/';
            if (in_array($type, ['select', 'radio'], true)) $rules[$name][] = Rule::in(array_column($field['options'] ?? [], 'value'));
        }
        if (!isset($rules['nim'], $rules['tanggal_lahir'])) {
            return response()->json(['message' => 'Skema identitas tidak tersedia.'], 503);
        }

        $divisionIds = $oprec->divisions->pluck('id')->map(fn ($id) => (string) $id)->all();
        foreach (['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3'] as $key) {
            $rules[$key] = ['required', 'string', Rule::in($divisionIds)];
        }
        foreach (['jabatan_pilihan_1', 'jabatan_pilihan_2', 'jabatan_pilihan_3'] as $key) {
            $rules[$key] = ['nullable', 'string', 'max:255'];
        }
        if (is_string($request->input('nim'))) {
            $request->merge(['nim' => strtoupper(trim($request->input('nim')))]);
        }
        $rules['nim'][] = 'regex:/^E31[A-Za-z0-9.\-]{0,29}$/D';
        $rules['tanggal_lahir'][] = 'before_or_equal:today';
        $rules['tanggal_lahir'][] = 'after_or_equal:1900-01-01';
        $data = Validator::make($request->all(), $rules, [
            'nim.regex' => 'NIM tidak valid.',
        ])->validate();

        $divisionChoices = array_map(fn ($key) => (string) $data[$key], ['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3']);
        if (count(array_unique($divisionChoices)) !== 3) {
            throw ValidationException::withMessages(['divisi_pilihan_1' => ['Pilih tepat 3 divisi yang berbeda.']]);
        }
        foreach ([1, 2, 3] as $rank) {
            $division = $oprec->divisions->firstWhere('id', (int) $data["divisi_pilihan_{$rank}"]);
            $data["jabatan_pilihan_{$rank}"] = $division->registrationPosition($data["jabatan_pilihan_{$rank}"] ?? null, $rank);
        }

        try {
            $updated = DB::transaction(function () use ($oprec, $registration, $data, $inactiveTargetFields) {
                $currentOprec = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
                abort_if($currentOprec->pengumuman_published, 409, 'Formulir terkunci setelah pengumuman dipublikasikan.');
                if ($currentOprec->schema_version !== $oprec->schema_version) {
                    throw new HttpResponseException(response()->json(['message' => 'Formulir telah berubah. Muat ulang halaman sebelum menyimpan.'], 409));
                }
                $current = OprecRegistration::whereKey($registration->id)->lockForUpdate()->firstOrFail();
                abort_unless($current->oprec_id === $oprec->id, 404);
                $newChoices = array_map('intval', [$data['divisi_pilihan_1'], $data['divisi_pilihan_2'], $data['divisi_pilihan_3']]);
                if ($current->status === 'accepted' && $current->accepted_division_id && !in_array((int) $current->accepted_division_id, $newChoices, true)) {
                    throw ValidationException::withMessages(['divisi_pilihan_1' => ['Pilihan tidak boleh menghapus divisi penerimaan peserta.']]);
                }

                $formData = is_array($current->form_data) ? $current->form_data : [];
                foreach ($inactiveTargetFields as $name) unset($formData[$name]);
                foreach ($data as $name => $value) {
                    if (!str_starts_with($name, 'divisi_pilihan_')) {
                        $formData[$name] = is_string($value) ? trim($value) : $value;
                    }
                }
                $current->update([
                    'nim' => $data['nim'],
                    'tanggal_lahir' => $data['tanggal_lahir'],
                    'form_data' => $formData,
                    'divisi_pilihan_1' => $newChoices[0],
                    'divisi_pilihan_2' => $newChoices[1],
                    'divisi_pilihan_3' => $newChoices[2],
                ]);

                return $current->fresh('user');
            });
        } catch (UniqueConstraintViolationException $error) {
            return response()->json(['message' => 'NIM sudah terdaftar pada periode ini.'], 409);
        }

        return response()->json(['data' => [
            'id' => $updated->id,
            'nim' => $updated->nim,
            'tanggalLahir' => $updated->tanggal_lahir?->format('Y-m-d'),
            'formData' => $updated->form_data ?? [],
            'divisiPilihan1' => $updated->divisi_pilihan_1,
            'divisiPilihan2' => $updated->divisi_pilihan_2,
            'divisiPilihan3' => $updated->divisi_pilihan_3,
        ]]);
    }

    public function destroy(Oprec $oprec, OprecRegistration $registration)
    {
        abort_unless($registration->oprec_id === $oprec->id, 404);
        $paths = DB::transaction(function () use ($oprec, $registration) {
            $period = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            $current = OprecRegistration::whereKey($registration->id)->lockForUpdate()->firstOrFail();
            abort_unless($current->oprec_id === $period->id, 404);
            abort_if($period->pengumuman_published || $current->status !== 'pending'
                || DB::table('oprec_assessment_reviews')->where('oprec_registration_id', $current->id)->exists(), 409,
                'Pendaftaran tidak dapat dihapus setelah penilaian atau pengumuman dimulai.');
            $files = collect($current->file_uploads ?? [])
                ->filter(fn ($path) => is_string($path) && str_starts_with($path, "oprec/{$period->id}/"))
                ->values();
            foreach (OprecTestSubmission::where('oprec_registration_id', $current->id)->get() as $submission) {
                foreach ($submission->answers ?? [] as $value) {
                    $path = is_array($value) ? ($value['path'] ?? null) : null;
                    if (is_string($path) && str_starts_with($path, "oprec/test/{$submission->oprec_stage_id}/")) $files->push($path);
                }
            }
            $current->delete();
            return $files;
        });
        foreach ($paths as $path) Storage::disk('local')->delete($path);

        return response()->noContent();
    }

    public function download(Oprec $oprec, OprecRegistration $registration, string $field)
    {
        abort_unless($registration->oprec_id === $oprec->id && preg_match('/^[a-z][a-z0-9_]{0,49}$/', $field), 404);
        $path = $registration->file_uploads[$field] ?? null;
        abort_unless(is_string($path) && str_starts_with($path, "oprec/{$oprec->id}/") && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, "oprec-{$registration->id}-{$field}", ['Cache-Control' => 'private, no-store']);
    }
}
