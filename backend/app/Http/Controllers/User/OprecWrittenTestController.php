<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\OprecStage;
use App\Support\OprecWrittenTestAnswers;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
        $questions = ($active || $submission) ? OprecWrittenTestAnswers::applicableQuestions($stage->form_fields ?? [], $registration) : [];

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
                'answers' => OprecWrittenTestAnswers::publicAnswers($submission->answers ?? []),
                'files' => OprecWrittenTestAnswers::files($submission->answers ?? [], url("/api/user/oprec/".$oprec->id."/written-test/files")),
                'submitted_at' => $submission->created_at?->toIso8601String(),
            ] : null,
        ]])->header('Cache-Control', 'private, no-store');
    }

    public function submit(Request $request, Oprec $oprec): JsonResponse
    {
        if ((int) $request->server('CONTENT_LENGTH', 0) > 12 * 1024 * 1024) return response()->json(['message' => 'Ukuran formulir terlalu besar.'], 413);
        $input = $request->validate(['answers' => ['present', 'array', 'max:40']]);
        $stored = [];
        try {
            $submission = DB::transaction(function () use ($request, $oprec, $input, &$stored) {
                Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
                $stage = OprecStage::where('oprec_id', $oprec->id)->where('type', 'test_tulis')->lockForUpdate()->firstOrFail();
                $registration = $this->registration($oprec, $request->user()->id, true);
                abort_unless($stage->published && count($stage->form_fields ?? []) > 0, 409, 'Soal tes tulis belum siap.');
                $now = now();
                abort_unless($now->gte($stage->tanggal_buka) && $now->lt($stage->tanggal_tutup), 409, 'Tes tulis belum dibuka atau sudah ditutup.');
                abort_if($stage->submissions()->where('user_id', $request->user()->id)->exists(), 409, 'Jawaban tes tulis sudah dikirim.');

                $questions = OprecWrittenTestAnswers::applicableQuestions($stage->form_fields ?? [], $registration);
                $answers = OprecWrittenTestAnswers::validateAndStore($questions, $input['answers'], $stage->id, $stored);

                return $stage->submissions()->create([
                    'oprec_registration_id' => $registration->id,
                    'user_id' => $request->user()->id,
                    'answers' => $answers,
                ]);
            });
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($stored);
            throw $error;
        }

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

}
