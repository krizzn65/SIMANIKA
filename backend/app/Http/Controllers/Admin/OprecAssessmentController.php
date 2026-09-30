<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\OprecTestSubmission;
use App\Models\User;
use App\Services\OprecAssessmentService;
use App\Support\OprecWrittenTestAnswers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OprecAssessmentController extends Controller
{
    public function __construct(private OprecAssessmentService $assessment) {}

    public function periods(Request $request)
    {
        $user = $request->user();
        $query = Oprec::query()->whereHas('writtenTest');
        if ($user->effectiveRole() === User::ROLE_LEADER) {
            $query->whereIn('id', DB::table('oprec_assessment_assignments')->select('oprec_id')
                ->where('user_id', $user->id)->whereNull('revoked_at'));
        }
        return response()->json(['data' => $query->latest('id')->get(['id', 'periode', 'pengumuman_published'])])
            ->header('Cache-Control', 'private, no-store');
    }

    public function index(Request $request, Oprec $oprec)
    {
        $this->assessment->authorize($request->user(), $oprec);
        $filters = $request->validate([
            'page' => ['nullable', 'integer', 'min:1'], 'search' => ['nullable', 'string', 'max:100'],
            'review' => ['nullable', Rule::in(['all', 'incomplete', 'complete'])],
            'decision' => ['nullable', Rule::in(['all', 'pending', 'accepted', 'rejected'])],
        ]);
        $stage = $oprec->writtenTest()->firstOrFail();
        $query = OprecTestSubmission::query()->select(['id', 'oprec_stage_id', 'oprec_registration_id', 'user_id'])
            ->where('oprec_stage_id', $stage->id)
            ->whereHas('registration', fn ($q) => $q->where('oprec_id', $oprec->id))
            ->with('registration.user:id,name');
        if (trim($filters['search'] ?? '') !== '') {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower(trim($filters['search'])));
            $pattern = '%'.$escaped.'%';
            $query->whereHas('registration', fn ($q) => $q->where(function ($search) use ($pattern) {
                $search->whereRaw("LOWER(nim) LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'nama') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'nama_lengkap') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'namaLengkap') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereHas('user', fn ($user) => $user->whereRaw("LOWER(name) LIKE ? ESCAPE '\\'", [$pattern]));
            }));
        }
        if (($filters['decision'] ?? 'all') !== 'all') {
            $query->whereHas('registration', fn ($q) => $q->where('status', $filters['decision']));
        }
        if (($filters['review'] ?? 'all') !== 'all') {
            abort_unless(in_array($request->user()->effectiveRole(), [User::ROLE_SUPER_ADMIN, User::ROLE_LEADER], true), 403);
            $complete = DB::table('oprec_assessment_reviews')->select('oprec_registration_id')->where('reviewer_id', $request->user()->id);
            foreach (OprecAssessmentService::CRITERIA as $criterion) $complete->whereNotNull($criterion);
            $query->whereIn('oprec_registration_id', $complete, 'and', $filters['review'] === 'incomplete');
        }
        $page = $query->orderBy('id')->paginate(20);
        $ids = $page->getCollection()->pluck('oprec_registration_id')->all();
        $reviews = DB::table('oprec_assessment_reviews')->whereIn('oprec_registration_id', $ids)->get()->groupBy('oprec_registration_id');
        $divisions = $oprec->divisions()->get(['id', 'nama'])->keyBy('id');
        $visibleFormFields = collect($oprec->form_fields ?? [])
            ->filter(fn ($field) => is_array($field) && ($field['type'] ?? null) !== 'file')
            ->pluck('name')->filter(fn ($name) => is_string($name) && !in_array($name, [
                'nama', 'nama_lengkap', 'namaLengkap', 'nim', 'tanggal_lahir', 'angkatan',
                'divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3',
                'jabatan_pilihan_1', 'jabatan_pilihan_2', 'jabatan_pilihan_3',
            ], true))->flip()->all();
        $visibleFileFields = collect($oprec->form_fields ?? [])
            ->filter(fn ($field) => is_array($field) && ($field['type'] ?? null) === 'file')
            ->pluck('name')->filter(fn ($name) => is_string($name))->flip()->all();
        $user = $request->user();
        $rows = $page->getCollection()->map(function ($submission) use ($reviews, $divisions, $visibleFormFields, $visibleFileFields, $user, $oprec) {
            $registration = $submission->registration;
            $form = $registration->form_data ?? [];
            $own = $reviews->get($registration->id, collect())->firstWhere('reviewer_id', $user->id);
            $canSeeAll = $user->effectiveRole() !== User::ROLE_LEADER || OprecAssessmentService::total($own) !== null;
            $visible = $canSeeAll ? $reviews->get($registration->id, collect()) : collect($own ? [$own] : []);
            $choices = collect([$registration->divisi_pilihan_1, $registration->divisi_pilihan_2, $registration->divisi_pilihan_3])->map(fn ($id, $index) => [
                'order' => $index + 1, 'id' => $id, 'division' => $divisions->get($id)?->nama,
                'applied_position' => $form['jabatan_pilihan_'.($index + 1)] ?? null,
                'positions' => $divisions->has($id) ? OprecAssessmentService::positions($divisions->get($id)->nama) : [],
            ])->all();
            $uploads = [];
            foreach ($registration->file_uploads ?? [] as $field => $path) {
                if (isset($visibleFileFields[$field]) && is_string($path) && $path !== '') $uploads[$field] = ['downloadUrl' => url("/api/admin/oprec/{$oprec->id}/assessment/{$submission->id}/registration-files/".rawurlencode($field))];
            }
            return [
                'id' => $submission->id, 'registration_id' => $registration->id,
                'name' => $form['nama'] ?? $form['nama_lengkap'] ?? $form['namaLengkap'] ?? $registration->user?->name ?? 'Peserta',
                'nim' => $registration->nim, 'angkatan' => $form['angkatan'] ?? null,
                'formData' => array_intersect_key($form, $visibleFormFields), 'fileUploads' => $uploads, 'choices' => $choices,
                'review' => $this->reviewData($own),
                'reviews' => $visible->map(fn ($review) => $this->reviewData($review))->values()->all(),
                'average' => $canSeeAll ? OprecAssessmentService::average($reviews->get($registration->id, collect())) : null,
                'reviews_hidden' => !$canSeeAll,
                'decision' => ['status' => $registration->status, 'division_id' => $registration->accepted_division_id,
                    'division' => $divisions->get($registration->accepted_division_id)?->nama,
                    'position' => $registration->accepted_position],
            ];
        });
        return response()->json(['data' => $rows, 'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total(),
            'form_fields' => $oprec->form_fields ?? [], 'period' => ['id' => $oprec->id, 'periode' => $oprec->periode,
                'locked' => (bool) $oprec->pengumuman_published],
            'is_reviewer' => in_array($user->effectiveRole(), [User::ROLE_SUPER_ADMIN, User::ROLE_LEADER], true),
            'can_review' => in_array($user->effectiveRole(), [User::ROLE_SUPER_ADMIN, User::ROLE_LEADER], true) && !$oprec->pengumuman_published,
            'can_decide' => $user->isSuperAdmin() && !$oprec->pengumuman_published,
        ])->header('Cache-Control', 'private, no-store');
    }

    public function show(Request $request, Oprec $oprec, OprecTestSubmission $submission)
    {
        $this->assessment->authorize($request->user(), $oprec);
        $stage = $oprec->writtenTest()->firstOrFail();
        abort_unless($submission->oprec_stage_id === $stage->id && $submission->registration?->oprec_id === $oprec->id, 404);
        $questionIds = collect($stage->form_fields ?? [])->pluck('id')->filter(fn ($id) => is_string($id))->flip()->all();
        $answers = array_intersect_key($submission->answers ?? [], $questionIds);
        return response()->json(['data' => ['id' => $submission->id,
            'answers' => OprecWrittenTestAnswers::publicAnswers($answers),
            'files' => OprecWrittenTestAnswers::files($answers, url("/api/admin/oprec/{$oprec->id}/assessment/{$submission->id}/test-files")),
            'questions' => $stage->form_fields ?? [],
        ]])->header('Cache-Control', 'private, no-store');
    }

    public function saveReview(Request $request, Oprec $oprec, OprecRegistration $registration)
    {
        $this->assessment->writable($request->user(), $oprec);
        abort_unless($registration->oprec_id === $oprec->id, 404);
        $data = $request->validate([
            'field' => ['required', Rule::in([...OprecAssessmentService::CRITERIA, 'comment'])],
            'value' => ['present'],
        ]);
        if ($data['field'] === 'comment') {
            if ($data['value'] !== null && (!is_string($data['value']) || mb_strlen($data['value']) > 2000)) {
                throw ValidationException::withMessages(['value' => ['Komentar maksimal 2000 karakter.']]);
            }
            $value = $data['value'] === null ? null : trim($data['value']);
        } else {
            $raw = $data['value'];
            if ($raw === null || $raw === '') $value = null;
            else {
                if (!is_string($raw) && !is_int($raw) && !is_float($raw)) {
                    throw ValidationException::withMessages(['value' => ['Nilai harus berupa angka 0–10.']]);
                }
                $normalized = is_string($raw) ? str_replace(',', '.', $raw) : (string) $raw;
                if (!preg_match('/^(?:10(?:\.0)?|[0-9](?:\.[0-9])?)$/D', $normalized)) {
                    throw ValidationException::withMessages(['value' => ['Nilai harus 0–10 dengan maksimal satu angka desimal.']]);
                }
                $value = (float) $normalized;
            }
        }
        $review = DB::transaction(function () use ($request, $oprec, $registration, $data, $value) {
            $period = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            $this->assessment->writable($request->user(), $period);
            abort_unless($period->writtenTest()->whereHas('submissions', fn ($q) => $q->where('oprec_registration_id', $registration->id))->exists(), 404);
            $review = DB::table('oprec_assessment_reviews')->where('oprec_registration_id', $registration->id)
                ->where('reviewer_id', $request->user()->id)->first();
            $attributes = [$data['field'] => $value, 'updated_at' => now()];
            if ($review) DB::table('oprec_assessment_reviews')->where('id', $review->id)->update($attributes);
            else DB::table('oprec_assessment_reviews')->insert($attributes + [
                'oprec_registration_id' => $registration->id, 'reviewer_id' => $request->user()->id,
                'reviewer_name' => $request->user()->name, 'created_at' => now(),
            ]);
            return DB::table('oprec_assessment_reviews')->where('oprec_registration_id', $registration->id)
                ->where('reviewer_id', $request->user()->id)->first();
        });
        $reviews = DB::table('oprec_assessment_reviews')->where('oprec_registration_id', $registration->id)->get();
        $canSeeAll = $request->user()->effectiveRole() !== User::ROLE_LEADER || OprecAssessmentService::total($review) !== null;
        $visible = $canSeeAll ? $reviews : collect([$review]);
        return response()->json(['data' => $this->reviewData($review), 'summary' => [
            'reviews' => $visible->map(fn ($item) => $this->reviewData($item))->values()->all(),
            'average' => $canSeeAll ? OprecAssessmentService::average($reviews) : null,
            'reviews_hidden' => !$canSeeAll,
        ]])->header('Cache-Control', 'private, no-store');
    }

    public function assignments(Request $request, Oprec $oprec)
    {
        $this->assessment->superAdmin($request->user(), $oprec);
        $assigned = DB::table('oprec_assessment_assignments')->where('oprec_id', $oprec->id)->whereNull('revoked_at')->pluck('user_id');
        return response()->json(['data' => ['reviewers' => User::where('role', User::ROLE_LEADER)->orderBy('name')->get(['id', 'name', 'email']),
            'assigned_ids' => $assigned]])->header('Cache-Control', 'private, no-store');
    }

    public function setAssignment(Request $request, Oprec $oprec, User $reviewer)
    {
        $this->assessment->superAdmin($request->user(), $oprec);
        DB::transaction(function () use ($oprec, $reviewer, $request) {
            $period = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            abort_if($period->pengumuman_published, 409);
            abort_unless($reviewer->fresh()->effectiveRole() === User::ROLE_LEADER, 422);
            DB::table('oprec_assessment_assignments')->updateOrInsert(
                ['oprec_id' => $period->id, 'user_id' => $reviewer->id],
                ['assigned_by' => $request->user()->id, 'revoked_at' => null, 'updated_at' => now(), 'created_at' => now()]
            );
        });
        return response()->noContent();
    }

    public function revokeAssignment(Request $request, Oprec $oprec, User $reviewer)
    {
        $this->assessment->superAdmin($request->user(), $oprec);
        DB::transaction(function () use ($oprec, $reviewer) {
            $period = Oprec::whereKey($oprec->id)->lockForUpdate()->firstOrFail();
            abort_if($period->pengumuman_published, 409);
            DB::table('oprec_assessment_assignments')->where('oprec_id', $period->id)->where('user_id', $reviewer->id)
                ->update(['revoked_at' => now(), 'updated_at' => now()]);
        });
        return response()->noContent();
    }

    public function decide(Request $request, Oprec $oprec, OprecRegistration $registration)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['accepted', 'rejected'])],
            'accepted_division_id' => ['required_if:status,accepted', 'nullable', 'integer'],
            'accepted_position' => ['required_if:status,accepted', 'nullable', 'string', 'max:150']]);
        $result = $this->assessment->decide($request->user(), $oprec, $registration, $data);
        return response()->json(['data' => ['status' => $result->status, 'division_id' => $result->accepted_division_id,
            'position' => $result->accepted_position]]);
    }

    public function testFile(Request $request, Oprec $oprec, OprecTestSubmission $submission, string $field)
    {
        $this->assessment->authorize($request->user(), $oprec);
        $stage = $oprec->writtenTest()->firstOrFail();
        abort_unless($submission->oprec_stage_id === $stage->id && $submission->registration?->oprec_id === $oprec->id, 404);
        $question = collect($stage->form_fields ?? [])->firstWhere('id', $field);
        abort_unless(($question['type'] ?? null) === 'file', 404);
        $file = ($submission->answers ?? [])[$field] ?? null;
        $path = is_array($file) ? ($file['path'] ?? null) : null;
        abort_unless(is_string($path) && str_starts_with($path, "oprec/test/{$stage->id}/") && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, basename($file['name'] ?? 'berkas'), ['Cache-Control' => 'private, no-store']);
    }

    public function registrationFile(Request $request, Oprec $oprec, OprecTestSubmission $submission, string $field)
    {
        $this->assessment->authorize($request->user(), $oprec);
        $stage = $oprec->writtenTest()->firstOrFail();
        abort_unless($submission->oprec_stage_id === $stage->id && $submission->registration?->oprec_id === $oprec->id, 404);
        abort_unless(preg_match('/^[a-z][a-z0-9_]{0,49}$/D', $field), 404);
        abort_unless(collect($oprec->form_fields ?? [])->contains(fn ($item) => is_array($item)
            && ($item['name'] ?? null) === $field && ($item['type'] ?? null) === 'file'), 404);
        $path = ($submission->registration->file_uploads ?? [])[$field] ?? null;
        abort_unless(is_string($path) && str_starts_with($path, "oprec/{$oprec->id}/") && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, basename($path), ['Cache-Control' => 'private, no-store']);
    }

    private function reviewData($review): ?array
    {
        if (!$review) return null;
        $scores = [];
        foreach (OprecAssessmentService::CRITERIA as $key) $scores[$key] = $review->{$key} === null ? null : (float) $review->{$key};
        return ['id' => $review->id, 'reviewer_id' => $review->reviewer_id, 'reviewer_name' => $review->reviewer_name,
            'scores' => $scores, 'comment' => $review->comment, 'total' => OprecAssessmentService::total($review)];
    }
}
