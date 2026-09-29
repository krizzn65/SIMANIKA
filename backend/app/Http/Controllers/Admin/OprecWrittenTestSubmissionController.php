<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecStage;
use App\Models\OprecTestSubmission;
use App\Support\OprecWrittenTestAnswers;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OprecWrittenTestSubmissionController extends Controller
{
    public function index(Oprec $oprec): JsonResponse
    {
        $stage = $oprec->writtenTest()->firstOrFail();
        $divisions = $oprec->divisions()->pluck('nama', 'id');
        $submissions = $stage->submissions()
            ->with(['registration.user'])
            ->latest('id')->paginate(20);

        return response()->json([
            'data' => $submissions->getCollection()->map(fn (OprecTestSubmission $submission) => $this->row($submission, $divisions, $oprec->id))->all(),
            'questions' => $stage->form_fields ?? [],
            'current_page' => $submissions->currentPage(),
            'last_page' => $submissions->lastPage(),
            'total' => $submissions->total(),
            'per_page' => $submissions->perPage(),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function show(Oprec $oprec, OprecTestSubmission $submission): JsonResponse
    {
        $stage = $oprec->writtenTest()->firstOrFail();
        abort_unless($submission->oprec_stage_id === $stage->id, 404);
        $submission->load('registration.user');
        return response()->json(['data' => $this->row($submission, $oprec->divisions()->pluck('nama', 'id'), $oprec->id),
            'questions' => $stage->form_fields ?? [],
        ])->header('Cache-Control', 'private, no-store');
    }

    public function destroy(Oprec $oprec, OprecTestSubmission $submission)
    {
        $answers = DB::transaction(function () use ($oprec, $submission) {
            $period = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            abort_if($period->pengumuman_published, 409, 'Jawaban terkunci setelah pengumuman dipublikasikan.');
            $stage = OprecStage::where('oprec_id', $oprec->id)->where('type', 'test_tulis')->lockForUpdate()->firstOrFail();
            $record = $stage->submissions()->whereKey($submission->id)->lockForUpdate()->firstOrFail();
            abort_if(DB::table('oprec_assessment_reviews')->where('oprec_registration_id', $record->oprec_registration_id)->exists()
                || $record->registration?->status !== 'pending', 409, 'Jawaban tidak dapat dihapus setelah penilaian atau keputusan dimulai.');
            $files = $record->answers ?? [];
            $record->delete();
            return $files;
        });
        OprecWrittenTestAnswers::deleteFiles($answers);
        return response()->noContent();
    }

    private function row(OprecTestSubmission $submission, $divisions, int $oprecId): array
    {
        $registration = $submission->registration;
        $form = $registration?->form_data ?? [];
        return [
            'id' => $submission->id,
            'name' => $form['nama'] ?? $form['nama_lengkap'] ?? $registration?->user?->name ?? 'Peserta',
            'nim' => $registration?->nim,
            'divisions' => collect([
                $registration?->divisi_pilihan_1,
                $registration?->divisi_pilihan_2,
                $registration?->divisi_pilihan_3,
            ])->filter()->map(fn ($id) => $divisions->get($id, 'Divisi #'.$id))->values()->all(),
            'answers' => OprecWrittenTestAnswers::publicAnswers($submission->answers ?? []),
            'files' => OprecWrittenTestAnswers::files($submission->answers ?? [], url("/api/admin/oprec/".$oprecId."/written-test/submissions/".$submission->id."/files")),
            'submitted_at' => $submission->created_at?->toIso8601String(),
        ];
    }
}
