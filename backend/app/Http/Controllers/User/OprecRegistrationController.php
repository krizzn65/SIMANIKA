<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecDivision;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OprecRegistrationController extends Controller
{
    public function store(Request $request)
    {
        if ((int) $request->server('CONTENT_LENGTH', 0) > 12 * 1024 * 1024) return response()->json(['message' => 'Ukuran formulir terlalu besar.'], 413);
        $head = $request->validate(['oprec_id' => ['required', 'integer', 'exists:oprecs,id'], 'schema_version' => ['required', 'string', 'max:20']]);
        $oprec = Oprec::with('divisions')->findOrFail($head['oprec_id']);
        $currentPublicId = Oprec::where('status', '!=', 'draft')->latest('created_at')->latest('id')->value('id');
        if ($oprec->id !== $currentPublicId) return response()->json(['message' => 'Periode pendaftaran telah berubah. Muat ulang halaman.'], 409);
        if ($oprec->status !== 'open' || !$oprec->tanggal_buka || !$oprec->tanggal_tutup || now()->lt($oprec->tanggal_buka) || now()->gte($oprec->tanggal_tutup) || $oprec->divisions->count() < 3) return response()->json(['message' => 'Pendaftaran belum dibuka atau sudah ditutup.'], 409);
        if ($oprec->schema_version !== $head['schema_version']) return response()->json(['message' => 'Formulir sudah diperbarui. Muat ulang halaman.'], 409);
        $fields = $oprec->form_fields ?? [];
        if (!count($fields) || count($fields) > 40) return response()->json(['message' => 'Formulir belum tersedia.'], 409);

        $chosenDivisionIds = array_filter([
            (int) $request->input('divisi_pilihan_1'),
            (int) $request->input('divisi_pilihan_2'),
            (int) $request->input('divisi_pilihan_3'),
        ]);
        $chosenDivisions = $oprec->divisions->whereIn('id', $chosenDivisionIds);
        $chosenDivisionNames = $chosenDivisions->pluck('nama')->all();
        $chosenDivisionFullNames = $chosenDivisions->pluck('nama_lengkap')->filter()->all();

        $rules = [];
        foreach ($fields as $field) {
            $name = $field['name'] ?? '';
            $type = $field['type'] ?? '';
            if (!preg_match('/^[a-z][a-z0-9_]{0,49}$/', $name) || in_array($name, ['oprec_id', 'schema_version'], true) || !in_array($type, ['text', 'email', 'tel', 'url', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'], true)) return response()->json(['message' => 'Skema formulir tidak valid.'], 503);
            
            $targetType = $field['target_type'] ?? 'all';
            $targetDivisions = (array) ($field['target_divisions'] ?? []);
            $isTargeted = $targetType === 'specific' && count($targetDivisions) > 0;
            $matchesDivision = false;
            if ($isTargeted) {
                foreach ($targetDivisions as $td) {
                    $tdLower = strtolower(trim((string) $td));
                    if (in_array((string) $td, array_map('strval', $chosenDivisionIds), true) ||
                        in_array($tdLower, array_map('strtolower', $chosenDivisionNames), true) ||
                        in_array($tdLower, array_map('strtolower', $chosenDivisionFullNames), true)) {
                        $matchesDivision = true;
                        break;
                    }
                }
            }
            if ($isTargeted && !$matchesDivision) {
                $rules[$name] = ['exclude'];
                continue;
            }
            $isRequired = !empty($field['required']);
            $rules[$name] = [$isRequired ? 'required' : 'nullable'];
            if ($type === 'file') {
                $rules[$name][] = 'file';
                $rules[$name][] = 'mimes:pdf,jpg,jpeg,png';
                $rules[$name][] = 'max:'.(min(10, max(1, (int) ($field['maxSizeMB'] ?? 5))) * 1024);
            } elseif ($type === 'checkbox') {
                $rules[$name][] = Rule::in(['on']);
            } else {
                $rules[$name][] = 'string';
                if ($type !== 'number') $rules[$name][] = 'max:'.min(5000, max(1, (int) ($field['maxLength'] ?? ($type === 'textarea' ? 3000 : 255))));
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
        }
        if (!isset($rules['nim'], $rules['tanggal_lahir'])) return response()->json(['message' => 'Skema identitas tidak tersedia.'], 503);
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
        $uploadBytes = array_sum(array_map(fn ($value) => $value instanceof \Illuminate\Http\UploadedFile ? $value->getSize() : 0, $data));
        if ($uploadBytes > 11 * 1024 * 1024) return response()->json(['message' => 'Ukuran total berkas maksimal 11 MB.'], 413);

        foreach (['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3'] as $key) {
            if (!empty($data[$key]) && !$oprec->divisions->contains('id', (int) $data[$key])) throw ValidationException::withMessages([$key => ['Divisi tidak tersedia pada periode ini.']]);
        }
        if (count(array_unique(array_intersect_key($data, array_flip(['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3'])))) !== 3) throw ValidationException::withMessages(['divisi_pilihan_1' => ['Pilih tepat 3 divisi yang berbeda.']]);
        foreach ([1, 2, 3] as $rank) {
            $division = $oprec->divisions->firstWhere('id', (int) $data["divisi_pilihan_{$rank}"]);
            $data["jabatan_pilihan_{$rank}"] = $division->registrationPosition($data["jabatan_pilihan_{$rank}"] ?? null, $rank);
        }

        $stored = [];
        try {
            DB::transaction(function () use ($oprec, $request, $data, &$stored) {
                $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
                $divisionSnapshot = fn ($divisions) => $divisions->map(fn ($division) => $division->only(['id', 'nama', 'nama_lengkap', 'jabatan']))->all();
                if ($current->schema_version !== $oprec->schema_version || $current->form_fields !== $oprec->form_fields
                    || $divisionSnapshot($current->divisions) !== $divisionSnapshot($oprec->divisions)
                    || $current->status !== 'open' || !$current->tanggal_buka || !$current->tanggal_tutup || now()->lt($current->tanggal_buka) || now()->gte($current->tanggal_tutup)) {
                    throw new HttpResponseException(response()->json(['message' => 'Pendaftaran atau formulir telah berubah. Muat ulang halaman.'], 409));
                }
                $divisionId = !empty($data['divisi_pilihan_1']) ? (int) $data['divisi_pilihan_1'] : null;
                if ($divisionId) {
                    OprecDivision::where('oprec_id', $oprec->id)->lockForUpdate()->findOrFail($divisionId);
                }
                $filePaths = [];
                $answers = [];
                foreach ($data as $name => $value) {
                    if ($value instanceof \Illuminate\Http\UploadedFile) {
                        $extension = strtolower($value->getClientOriginalExtension());
                        $field = collect($oprec->form_fields)->firstWhere('name', $name);
                        if (!in_array('.'.$extension, $field['accept'] ?? ['.pdf', '.jpg', '.jpeg', '.png'], true)) throw ValidationException::withMessages([$name => ['Jenis berkas tidak diizinkan.']]);
                        $path = $value->store("oprec/{$oprec->id}", 'local');
                        if (!is_string($path)) throw new \RuntimeException('Private file storage failed');
                        $stored[] = $path;
                        $filePaths[$name] = $path;
                    } else $answers[$name] = is_string($value) ? trim($value) : $value;
                }
                $oprec->registrations()->create([
                    'user_id' => $request->user()->id, 'nim' => $answers['nim'], 'tanggal_lahir' => $answers['tanggal_lahir'],
                    'form_data' => $answers, 'file_uploads' => $filePaths,
                    'divisi_pilihan_1' => $divisionId,
                    'divisi_pilihan_2' => !empty($answers['divisi_pilihan_2']) ? (int) $answers['divisi_pilihan_2'] : null,
                    'divisi_pilihan_3' => (int) $answers['divisi_pilihan_3'],
                ]);
                DB::table('oprec_enrollments')->where('oprec_id', $oprec->id)->where('user_id', $request->user()->id)->delete();
            });
        } catch (UniqueConstraintViolationException $error) {
            Storage::disk('local')->delete($stored);
            return response()->json(['message' => 'Pendaftaran untuk periode ini sudah ada.'], 409);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($stored);
            throw $error;
        }
        return response()->json(['data' => ['submitted' => true]], 201);
    }
}
