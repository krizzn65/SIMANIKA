<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecStage;
use App\Models\OprecTestSubmission;
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
            'data' => $submissions->getCollection()->map(fn (OprecTestSubmission $submission) => $this->row($submission, $divisions))->all(),
            'questions' => $stage->form_fields ?? [],
            'current_page' => $submissions->currentPage(),
            'last_page' => $submissions->lastPage(),
            'total' => $submissions->total(),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function show(Oprec $oprec, OprecTestSubmission $submission): JsonResponse
    {
        $stage = $oprec->writtenTest()->firstOrFail();
        abort_unless($submission->oprec_stage_id === $stage->id, 404);
        $submission->load('registration.user');
        return response()->json(['data' => $this->row($submission, $oprec->divisions()->pluck('nama', 'id')),
            'questions' => $stage->form_fields ?? [],
        ])->header('Cache-Control', 'private, no-store');
    }

    public function destroy(Oprec $oprec, OprecTestSubmission $submission)
    {
        DB::transaction(function () use ($oprec, $submission) {
            Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            $stage = OprecStage::where('oprec_id', $oprec->id)->where('type', 'test_tulis')->lockForUpdate()->firstOrFail();
            $record = $stage->submissions()->whereKey($submission->id)->lockForUpdate()->firstOrFail();
            $record->delete();
        });
        return response()->noContent();
    }

    private function row(OprecTestSubmission $submission, $divisions): array
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
            'answers' => $submission->answers ?? [],
            'submitted_at' => $submission->created_at?->toIso8601String(),
        ];
    }
}
