<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\OprecStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OprecWrittenTestController extends Controller
{
    public function show(Request $request, Oprec $oprec): JsonResponse
    {
        $registration = $this->registration($oprec, $request->user()->id);
        $stage = $oprec->writtenTest()->first();
        if (!$stage) return response()->json(['data' => null])->header('Cache-Control', 'private, no-store');

        $submission = $stage->submissions()->where('user_id', $request->user()->id)->first();
        $ready = $stage->published && count($stage->form_fields ?? []) > 0;
        $now = now();
        $active = $ready && $now->gte($stage->tanggal_buka) && $now->lt($stage->tanggal_tutup);
        $questions = ($active || $submission) ? $this->applicableQuestions($stage, $registration) : [];

        return response()->json(['data' => [
            'id' => $stage->id,
            'headline' => $stage->headline,
            'tanggal_buka' => $stage->tanggal_buka->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup->toIso8601String(),
            'server_now' => $now->toIso8601String(),
            'ready' => $ready,
            'active' => $active,
            'questions' => $questions,
            'submission' => $submission ? [
                'answers' => $submission->answers,
                'submitted_at' => $submission->created_at?->toIso8601String(),
            ] : null,
        ]])->header('Cache-Control', 'private, no-store');
    }

    public function submit(Request $request, Oprec $oprec): JsonResponse
    {
        $input = $request->validate(['answers' => ['present', 'array', 'max:40']]);
        $submission = DB::transaction(function () use ($request, $oprec, $input) {
            Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            $stage = OprecStage::where('oprec_id', $oprec->id)->where('type', 'test_tulis')->lockForUpdate()->firstOrFail();
            $registration = $this->registration($oprec, $request->user()->id, true);
            abort_unless($stage->published && count($stage->form_fields ?? []) > 0, 409, 'Soal tes tulis belum siap.');
            $now = now();
            abort_unless($now->gte($stage->tanggal_buka) && $now->lt($stage->tanggal_tutup), 409, 'Tes tulis belum dibuka atau sudah ditutup.');
            abort_if($stage->submissions()->where('user_id', $request->user()->id)->exists(), 409, 'Jawaban tes tulis sudah dikirim.');

            $questions = $this->applicableQuestions($stage, $registration);
            $allowed = array_column($questions, 'id');
            $raw = $input['answers'];
            if (array_diff(array_keys($raw), $allowed)) {
                throw ValidationException::withMessages(['answers' => ['Jawaban memuat pertanyaan yang tidak berlaku.']]);
            }

            $answers = [];
            foreach ($questions as $question) {
                $id = $question['id'];
                $value = $raw[$id] ?? null;
                if ($value === null || $value === '') {
                    if ($question['required']) throw ValidationException::withMessages(["answers.$id" => ['Pertanyaan ini wajib dijawab.']]);
                    continue;
                }
                if (!is_string($value)) throw ValidationException::withMessages(["answers.$id" => ['Jawaban harus berupa teks.']]);
                $value = trim($value);
                if ($value === '') {
                    if ($question['required']) throw ValidationException::withMessages(["answers.$id" => ['Pertanyaan ini wajib dijawab.']]);
                    continue;
                }
                $limit = $question['type'] === 'paragraph' ? 5000 : ($question['type'] === 'short_text' ? 500 : 200);
                if (mb_strlen($value) > $limit) throw ValidationException::withMessages(["answers.$id" => ["Jawaban maksimal $limit karakter."]]);
                if ($question['type'] === 'single_choice' && !in_array($value, $question['options'] ?? [], true)) {
                    throw ValidationException::withMessages(["answers.$id" => ['Pilihan jawaban tidak tersedia.']]);
                }
                $answers[$id] = $value;
            }

            return $stage->submissions()->create([
                'oprec_registration_id' => $registration->id,
                'user_id' => $request->user()->id,
                'answers' => $answers,
            ]);
        });

        return response()->json(['data' => [
            'submitted' => true,
            'submitted_at' => $submission->created_at?->toIso8601String(),
        ]], 201)->header('Cache-Control', 'private, no-store');
    }

    private function registration(Oprec $oprec, int $userId, bool $lock = false): OprecRegistration
    {
        $query = OprecRegistration::where('oprec_id', $oprec->id)->where('user_id', $userId);
        return ($lock ? $query->lockForUpdate() : $query)->firstOrFail();
    }

    private function applicableQuestions(OprecStage $stage, OprecRegistration $registration): array
    {
        $selected = array_map('intval', array_filter([
            $registration->divisi_pilihan_1,
            $registration->divisi_pilihan_2,
            $registration->divisi_pilihan_3,
        ]));
        return array_values(array_filter($stage->form_fields ?? [], function ($question) use ($selected) {
            $targets = array_map('intval', $question['targetDivisions'] ?? []);
            return !$targets || (bool) array_intersect($targets, $selected);
        }));
    }
}
