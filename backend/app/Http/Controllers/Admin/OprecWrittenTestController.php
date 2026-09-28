<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OprecWrittenTestController extends Controller
{
    public function index(): JsonResponse
    {
        $periods = Oprec::query()
            ->with('writtenTest:id,oprec_id,headline,tanggal_buka,tanggal_tutup,published')
            ->latest('created_at')->latest('id')
            ->paginate(20, ['id', 'periode', 'headline', 'status', 'created_at']);

        return response()->json($periods);
    }

    public function show(Oprec $oprec): JsonResponse
    {
        $stage = $oprec->writtenTest()->first();
        return response()->json(['data' => [
            'oprec' => $oprec->only(['id', 'periode', 'headline', 'status']),
            'divisions' => $oprec->divisions()->get(['id', 'nama']),
            'test' => $stage ? $this->stageData($stage) : null,
        ]]);
    }

    public function save(Request $request, Oprec $oprec): JsonResponse
    {
        $data = $request->validate([
            'headline' => ['required', 'string', 'max:300'],
            'deskripsi' => ['nullable', 'string', 'max:5000'],
            'tanggal_buka' => ['required', 'date'],
            'tanggal_tutup' => ['required', 'date', 'after:tanggal_buka'],
            'questions' => ['required', 'array', 'min:1', 'max:40'],
            'questions.*.id' => ['required', 'string', 'regex:/^[a-z][a-z0-9_]{0,39}$/', 'distinct'],
            'questions.*.label' => ['required', 'string', 'max:300'],
            'questions.*.type' => ['required', Rule::in(['short_text', 'paragraph', 'single_choice'])],
            'questions.*.required' => ['required', 'boolean'],
            'questions.*.options' => ['sometimes', 'array', 'max:10'],
            'questions.*.options.*' => ['string', 'max:200'],
            'questions.*.targetDivisions' => ['sometimes', 'array', 'max:30'],
            'questions.*.targetDivisions.*' => ['integer'],
        ]);

        $divisionIds = $oprec->divisions()->pluck('id')->map(fn ($id) => (int) $id)->all();
        $questions = [];
        foreach ($data['questions'] as $index => $question) {
            $options = array_values(array_map('trim', $question['options'] ?? []));
            if ($question['type'] === 'single_choice') {
                if (count($options) < 2 || count(array_filter($options, fn ($option) => $option !== '')) !== count($options)
                    || count(array_unique(array_map('mb_strtolower', $options))) !== count($options)) {
                    throw ValidationException::withMessages(["questions.$index.options" => ['Pilihan jawaban harus berisi 2–10 opsi unik dan tidak kosong.']]);
                }
            } else {
                $options = [];
            }
            $targets = array_map('intval', $question['targetDivisions'] ?? []);
            if (count(array_unique($targets)) !== count($targets) || array_diff($targets, $divisionIds)) {
                throw ValidationException::withMessages(["questions.$index.targetDivisions" => ['Divisi tujuan tidak termasuk periode ini.']]);
            }
            $questions[] = [
                'id' => $question['id'],
                'label' => trim($question['label']),
                'type' => $question['type'],
                'required' => (bool) $question['required'],
                'options' => $options,
                'targetDivisions' => $targets,
            ];
        }

        $stage = DB::transaction(function () use ($oprec, $data, $questions) {
            Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            $stage = OprecStage::where('oprec_id', $oprec->id)
                ->where('type', 'test_tulis')->lockForUpdate()->first();
            if ($stage && $stage->submissions()->exists() && $stage->form_fields !== $questions) {
                throw ValidationException::withMessages(['questions' => ['Soal tidak dapat diubah setelah ada jawaban peserta.']]);
            }
            $stage ??= new OprecStage(['oprec_id' => $oprec->id, 'type' => 'test_tulis']);
            $stage->fill([
                'headline' => trim($data['headline']),
                'deskripsi' => trim($data['deskripsi'] ?? ''),
                'tanggal_buka' => $data['tanggal_buka'],
                'tanggal_tutup' => $data['tanggal_tutup'],
                'form_fields' => $questions,
                'published' => false,
            ]);
            $stage->save();
            return $stage;
        });

        return response()->json(['data' => $this->stageData($stage)], $stage->wasRecentlyCreated ? 201 : 200);
    }

    private function stageData(OprecStage $stage): array
    {
        return [
            'id' => $stage->id,
            'headline' => $stage->headline,
            'deskripsi' => $stage->deskripsi,
            'tanggal_buka' => $stage->tanggal_buka?->toIso8601String(),
            'tanggal_tutup' => $stage->tanggal_tutup?->toIso8601String(),
            'published' => $stage->published,
            'questions' => $stage->form_fields ?? [],
        ];
    }
}
