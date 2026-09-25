<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\OprecStage;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class OprecTestController extends Controller
{
    private function eligible(Request $request, OprecStage $stage)
    {
        abort_unless($stage->type === 'test_tulis' && $stage->published, 404);
        $registration = $stage->oprec->registrations()->where('user_id', $request->user()->id)->first();
        abort_unless($registration, 403, 'Tes hanya untuk peserta yang sudah mendaftar.');
        return $registration;
    }

    public function show(Request $request, OprecStage $stage)
    {
        $this->eligible($request, $stage);
        $now = now();
        $available = $now->gte($stage->tanggal_buka) && $now->lt($stage->tanggal_tutup);
        return response()->json(['data' => [
            'id' => $stage->id, 'headline' => $stage->headline,
            'tanggalBuka' => $stage->tanggal_buka?->toIso8601String(),
            'tanggalTutup' => $stage->tanggal_tutup?->toIso8601String(),
            'available' => $available,
            'submitted' => DB::table('oprec_test_submissions')->where('oprec_stage_id', $stage->id)->where('user_id', $request->user()->id)->exists(),
            'formFields' => $available ? ($stage->form_fields ?? []) : [],
        ]], 200, ['Cache-Control' => 'private, no-store']);
    }

    public function store(Request $request, OprecStage $stage)
    {
        $registration = $this->eligible($request, $stage);
        if (now()->lt($stage->tanggal_buka) || now()->gte($stage->tanggal_tutup)) return response()->json(['message' => 'Waktu tes belum dimulai atau sudah berakhir.'], 409);
        $fields = $stage->form_fields ?? [];
        if (!$fields || count($fields) > 40) return response()->json(['message' => 'Form tes belum tersedia.'], 409);
        $rules = [];
        foreach ($fields as $field) {
            $name = $field['name'] ?? '';
            $type = $field['type'] ?? '';
            if (!preg_match('/^[a-z][a-z0-9_]{0,49}$/', $name) || !in_array($type, ['text', 'textarea', 'number', 'select', 'radio', 'checkbox'], true)) return response()->json(['message' => 'Skema tes tidak valid.'], 503);
            $rules[$name] = [($field['required'] ?? false) ? 'required' : 'nullable'];
            if ($type === 'checkbox') $rules[$name][] = Rule::in(['on']);
            else {
                $rules[$name][] = 'string';
                $rules[$name][] = 'max:'.min(5000, max(1, (int) ($field['maxLength'] ?? 255)));
                if ($type === 'number') $rules[$name][] = 'numeric';
                if (in_array($type, ['select', 'radio'], true)) $rules[$name][] = Rule::in(array_column($field['options'] ?? [], 'value'));
            }
        }
        $answers = Validator::make($request->all(), $rules)->validate();
        try {
            DB::transaction(function () use ($stage, $registration, $request, $answers) {
                $locked = OprecStage::whereKey($stage->id)->lockForUpdate()->firstOrFail();
                if (!$locked->published || now()->lt($locked->tanggal_buka) || now()->gte($locked->tanggal_tutup)) abort(409, 'Waktu tes telah berubah.');
                DB::table('oprec_test_submissions')->insert([
                    'oprec_stage_id' => $stage->id, 'oprec_registration_id' => $registration->id,
                    'user_id' => $request->user()->id, 'answers' => json_encode($answers, JSON_THROW_ON_ERROR),
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            });
        } catch (UniqueConstraintViolationException $error) {
            return response()->json(['message' => 'Jawaban tes sudah pernah dikirim.'], 409);
        }
        return response()->json(['data' => ['submitted' => true]], 201);
    }
}
