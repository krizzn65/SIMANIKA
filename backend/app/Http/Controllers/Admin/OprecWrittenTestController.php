<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecStage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OprecWrittenTestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $periods = Oprec::query()
            ->with(['writtenTest' => fn ($query) => $query->withCount('submissions')])
            ->latest('created_at')->latest('id')
            ->paginate(20, ['id', 'periode', 'headline', 'status', 'first_published_at', 'created_at']);

        $canManage = in_array($request->user()->effectiveRole(), ['super_admin', 'admin'], true);
        $periods->getCollection()->transform(function (Oprec $period) use ($canManage) {
            $period->can_create_test = $canManage && $period->first_published_at !== null && $period->writtenTest === null;
            if (!$canManage && $period->writtenTest) $period->writtenTest->makeHidden(['form_fields']);
            return $period;
        });
        $response = $periods->toArray();
        $response['eligible_periods'] = $canManage ? Oprec::query()->whereNotNull('first_published_at')
            ->whereDoesntHave('writtenTest')->latest('created_at')->get(['id', 'periode']) : [];
        return response()->json($response);
    }

    public function show(Oprec $oprec): JsonResponse
    {
        $stage = $oprec->writtenTest()->first();
        return response()->json(['data' => [
            'oprec' => $oprec->only(['id', 'periode', 'headline', 'status', 'first_published_at']),
            'divisions' => $oprec->divisions()->get(['id', 'nama']),
            'test' => $stage ? $this->stageData($stage->loadCount('submissions')) : null,
        ]]);
    }

    public function create(Request $request, Oprec $oprec): JsonResponse
    {
        $data = $request->validate([
            'tanggal_buka' => ['required', 'date'],
            'tanggal_tutup' => ['required', 'date', 'after:tanggal_buka'],
        ]);
        $stage = DB::transaction(function () use ($oprec, $data) {
            $current = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            abort_unless($current->first_published_at, 422, 'Pendaftaran OPREC harus pernah dibuka sebelum membuat tes tulis.');
            abort_if($current->writtenTest()->exists(), 409, 'Tes tulis untuk periode ini sudah ada.');
            return $current->writtenTest()->create([
                'type' => 'test_tulis',
                'headline' => 'Tes Tulis OPREC '.$current->periode,
                'tanggal_buka' => $data['tanggal_buka'],
                'tanggal_tutup' => $data['tanggal_tutup'],
                'form_fields' => [],
                'published' => false,
            ]);
        });
        return response()->json(['data' => $this->stageData($stage)], 201);
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
            'questions.*.type' => ['required', Rule::in(['short_text', 'paragraph', 'email', 'tel', 'url', 'number', 'date', 'select', 'single_choice', 'checkbox', 'file'])],
            'questions.*.required' => ['required', 'boolean'],
            'questions.*.help' => ['nullable', 'string', 'max:500'],
            'questions.*.options' => ['sometimes', 'array', 'max:10'],
            'questions.*.options.*' => ['string', 'max:200'],
            'questions.*.targetDivisions' => ['sometimes', 'array', 'max:30'],
            'questions.*.targetDivisions.*' => ['integer'],
        ]);

        $divisionIds = $oprec->divisions()->pluck('id')->map(fn ($id) => (int) $id)->all();
        $questions = [];
        foreach ($data['questions'] as $index => $question) {
            $options = array_values(array_map('trim', $question['options'] ?? []));
            if (in_array($question['type'], ['single_choice', 'select'], true)) {
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
            $label = trim($question['label']);
            if ($label === '') {
                throw ValidationException::withMessages(["questions.$index.label" => ['Pertanyaan tidak boleh kosong.']]);
            }
            $questions[] = [
                'id' => $question['id'],
                'label' => $label,
                'type' => $question['type'],
                'required' => (bool) $question['required'],
                'help' => trim($question['help'] ?? ''),
                'options' => $options,
                'targetDivisions' => $targets,
            ];
        }

        $stage = DB::transaction(function () use ($oprec, $data, $questions) {
            Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            $stage = OprecStage::where('oprec_id', $oprec->id)
                ->where('type', 'test_tulis')->lockForUpdate()->first();
            abort_unless($stage, 404, 'Tes tulis belum dibuat.');
            $locked = ($stage->published && $stage->tanggal_buka->isPast()) || $stage->submissions()->exists();
            if ($locked && $stage->form_fields !== $questions) {
                throw ValidationException::withMessages(['questions' => ['Soal tidak dapat diubah setelah tes dimulai atau ada jawaban peserta.']]);
            }
            if ($locked && (
                !$stage->tanggal_buka->equalTo(Carbon::parse($data['tanggal_buka']))
                || !$stage->tanggal_tutup->equalTo(Carbon::parse($data['tanggal_tutup']))
            )) {
                throw ValidationException::withMessages(['tanggal_buka' => ['Jadwal tidak dapat diubah setelah tes dimulai atau ada jawaban peserta.']]);
            }
            $stage->fill([
                'headline' => trim($data['headline']),
                'deskripsi' => trim($data['deskripsi'] ?? ''),
                'tanggal_buka' => $data['tanggal_buka'],
                'tanggal_tutup' => $data['tanggal_tutup'],
                'form_fields' => $questions,
                'published' => true,
            ]);
            $stage->save();
            return $stage;
        });

        return response()->json(['data' => $this->stageData($stage)], 200);
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
            'submissions_count' => $stage->submissions_count ?? $stage->submissions()->count(),
        ];
    }
}
