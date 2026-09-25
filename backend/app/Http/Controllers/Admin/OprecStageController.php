<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OprecStageController extends Controller
{
    private function rules(Request $request, Oprec $oprec, ?OprecStage $stage = null): array
    {
        return $request->validate([
            'type' => ['required', Rule::in(['test_tulis', 'pengumuman']), Rule::unique('oprec_stages')->where('oprec_id', $oprec->id)->ignore($stage?->id)],
            'headline' => ['required', 'string', 'max:300'],
            'deskripsi' => ['nullable', 'string', 'max:5000'],
            'poster' => ['nullable', 'url:http,https', 'max:2048'],
            'tanggal_buka' => ['required', 'date'],
            'tanggal_tutup' => ['required_if:type,test_tulis', 'nullable', 'date', 'after:tanggal_buka'],
            'published' => ['required', 'boolean'],
        ]);
    }

    public function store(Request $request, Oprec $oprec)
    {
        $data = $this->rules($request, $oprec);
        if ($data['type'] === 'pengumuman' && $data['published'] && $oprec->status !== 'closed' && (!$oprec->tanggal_tutup || $oprec->tanggal_tutup->isFuture())) throw ValidationException::withMessages(['published' => ['Tutup pendaftaran sebelum menerbitkan pengumuman.']]);
        if ($data['type'] === 'test_tulis' && $data['published']) throw ValidationException::withMessages(['published' => ['Susun form tes tulis sebelum menerbitkan.']]);
        $stage = DB::transaction(function () use ($oprec, $data) {
            $stage = $oprec->stages()->create($data);
            $this->syncAnnouncement($oprec, $stage);
            return $stage;
        });
        return response()->json(['data' => $this->payload($stage)], 201);
    }

    public function update(Request $request, Oprec $oprec, OprecStage $stage)
    {
        abort_unless($stage->oprec_id === $oprec->id, 404);
        $data = $this->rules($request, $oprec, $stage);
        if ($stage->type !== $data['type']) throw ValidationException::withMessages(['type' => ['Jenis tahap tidak dapat diubah.']]);
        if ($data['type'] === 'pengumuman' && $data['published'] && $oprec->status !== 'closed' && (!$oprec->tanggal_tutup || $oprec->tanggal_tutup->isFuture())) throw ValidationException::withMessages(['published' => ['Tutup pendaftaran sebelum menerbitkan pengumuman.']]);
        if ($data['type'] === 'test_tulis' && $data['published'] && !count($stage->form_fields ?? [])) throw ValidationException::withMessages(['published' => ['Susun form tes tulis sebelum menerbitkan.']]);
        DB::transaction(function () use ($oprec, $stage, $data) {
            $stage->update($data);
            $this->syncAnnouncement($oprec, $stage);
        });
        return response()->json(['data' => $this->payload($stage->fresh())]);
    }


    public function saveForm(Request $request, Oprec $oprec, OprecStage $stage)
    {
        abort_unless($stage->oprec_id === $oprec->id && $stage->type === 'test_tulis', 404);
        $data = $request->validate([
            'form_fields' => ['required', 'array', 'min:1', 'max:40'],
            'form_fields.*.name' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/'],
            'form_fields.*.label' => ['required', 'string', 'max:200'],
            'form_fields.*.type' => ['required', Rule::in(['text', 'textarea', 'number', 'select', 'radio', 'checkbox'])],
            'form_fields.*.required' => ['required', 'boolean'],
            'form_fields.*.help' => ['nullable', 'string', 'max:500'],
            'form_fields.*.maxLength' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'form_fields.*.options' => ['nullable', 'array', 'max:100'],
            'form_fields.*.options.*.value' => ['required', 'string', 'max:150'],
            'form_fields.*.options.*.label' => ['required', 'string', 'max:150'],
            'published' => ['required', 'boolean'],
        ]);
        $fields = $data['form_fields'];
        $names = array_column($fields, 'name');
        if (count($names) !== count(array_unique($names))) throw ValidationException::withMessages(['form_fields' => ['Kode pertanyaan harus unik.']]);
        foreach ($fields as $index => $field) {
            if (in_array($field['type'], ['select', 'radio'], true)) {
                $options = array_column($field['options'] ?? [], 'value');
                if (!$options || count($options) !== count(array_unique($options))) throw ValidationException::withMessages(["form_fields.{$index}.options" => ['Isi pilihan unik untuk pertanyaan ini.']]);
            }
        }
        DB::transaction(function () use ($stage, $fields, $data) {
            $locked = OprecStage::whereKey($stage->id)->lockForUpdate()->firstOrFail();
            if (DB::table('oprec_test_submissions')->where('oprec_stage_id', $stage->id)->exists() && $locked->form_fields !== $fields) {
                throw ValidationException::withMessages(['form_fields' => ['Pertanyaan tidak dapat diubah setelah ada jawaban.']]);
            }
            $locked->update(['form_fields' => $fields, 'published' => $data['published']]);
        });
        return response()->json(['data' => ['saved' => true, 'published' => (bool) $data['published']]]);
    }

    private function syncAnnouncement(Oprec $oprec, OprecStage $stage): void
    {
        if ($stage->type !== 'pengumuman') return;
        $oprec->update([
            'pengumuman_published' => $stage->published,
            'pengumuman_tanggal' => $stage->tanggal_buka,
            'pengumuman_pesan' => $stage->deskripsi,
        ]);
    }

    private function payload(OprecStage $stage): array
    {
        return ['id' => $stage->id, 'type' => $stage->type, 'headline' => $stage->headline, 'deskripsi' => $stage->deskripsi,
            'poster' => $stage->poster, 'tanggalBuka' => $stage->tanggal_buka?->toIso8601String(),
            'tanggalTutup' => $stage->tanggal_tutup?->toIso8601String(), 'published' => $stage->published];
    }
}
