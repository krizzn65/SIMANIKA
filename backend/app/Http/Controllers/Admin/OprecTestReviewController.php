<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Oprec\ScoreTestSubmissionRequest;
use App\Models\Oprec;
use App\Models\OprecStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OprecTestReviewController extends Controller
{
    public function index(Request $request, Oprec $oprec, OprecStage $stage)
    {
        $this->assertStage($oprec, $stage);
        $filters = $request->validate([
            'division_id' => ['nullable', 'integer', Rule::exists('oprec_divisions', 'id')->where('oprec_id', $oprec->id)],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $averages = DB::table('oprec_test_scores')->select('submission_id')
            ->selectRaw('COUNT(*) as score_count, ROUND(AVG(score), 2) as average_score')
            ->groupBy('submission_id');
        $base = DB::table('oprec_test_submissions as submissions')
            ->join('oprec_registrations as registrations', 'registrations.id', '=', 'submissions.oprec_registration_id')
            ->join('users', 'users.id', '=', 'submissions.user_id')
            ->leftJoinSub($averages, 'ratings', 'ratings.submission_id', '=', 'submissions.id')
            ->where('submissions.oprec_stage_id', $stage->id)
            ->where('registrations.oprec_id', $oprec->id);

        if (isset($filters['division_id'])) $base->where('registrations.divisi_pilihan_1', $filters['division_id']);

        // Rank the complete division before pagination; equal averages share a rank.
        $rankRows = (clone $base)->select('submissions.id', 'registrations.divisi_pilihan_1 as division_id', 'ratings.average_score')
            ->whereNotNull('ratings.average_score')->get()->groupBy('division_id');
        $ranks = [];
        foreach ($rankRows as $divisionRows) {
            $sorted = $divisionRows->sortByDesc(fn ($row) => (float) $row->average_score)->values();
            $previous = null;
            $rank = 0;
            foreach ($sorted as $index => $row) {
                $average = number_format((float) $row->average_score, 2, '.', '');
                if ($average !== $previous) $rank = $index + 1;
                $ranks[$row->id] = $rank;
                $previous = $average;
            }
        }

        $page = $base->select('submissions.id', 'submissions.answers', 'submissions.created_at',
            'registrations.nim', 'registrations.divisi_pilihan_1 as division_id',
            'users.name', 'ratings.score_count', 'ratings.average_score')
            ->orderBy('registrations.divisi_pilihan_1')
            ->orderByRaw('CASE WHEN ratings.average_score IS NULL THEN 1 ELSE 0 END')
            ->orderByDesc('ratings.average_score')->orderBy('submissions.id')
            ->paginate(20);
        $myScores = DB::table('oprec_test_scores')->where('reviewer_id', $request->user()->id)
            ->whereIn('submission_id', $page->getCollection()->pluck('id'))
            ->get()->keyBy('submission_id');

        return response()->json([
            'data' => $page->getCollection()->map(function ($row) use ($ranks, $myScores) {
                $mine = $myScores->get($row->id);
                return [
                    'id' => $row->id, 'name' => $row->name, 'nim' => $row->nim,
                    'divisionId' => $row->division_id,
                    'answers' => json_decode($row->answers, true) ?: [],
                    'submittedAt' => $row->created_at,
                    'averageScore' => $row->average_score === null ? null : (float) $row->average_score,
                    'scoreCount' => (int) ($row->score_count ?? 0),
                    'rank' => $ranks[$row->id] ?? null,
                    'myScore' => $mine ? (float) $mine->score : null,
                    'myNote' => $mine?->note,
                ];
            })->all(),
            'fields' => $stage->form_fields ?? [],
            'divisions' => $oprec->divisions()->get(['id', 'nama']),
            'meta' => ['currentPage' => $page->currentPage(), 'lastPage' => $page->lastPage(), 'total' => $page->total()],
        ], 200, ['Cache-Control' => 'private, no-store']);
    }

    public function score(ScoreTestSubmissionRequest $request, Oprec $oprec, OprecStage $stage, int $submission)
    {
        $this->assertStage($oprec, $stage);
        $exists = DB::table('oprec_test_submissions as submissions')
            ->join('oprec_registrations as registrations', 'registrations.id', '=', 'submissions.oprec_registration_id')
            ->where('submissions.id', $submission)->where('submissions.oprec_stage_id', $stage->id)
            ->where('registrations.oprec_id', $oprec->id)->exists();
        abort_unless($exists, 404);
        $data = $request->validated();
        DB::table('oprec_test_scores')->upsert([[
            'submission_id' => $submission, 'reviewer_id' => $request->user()->id,
            'score' => $data['score'], 'note' => $data['note'] ?? null,
            'created_at' => now(), 'updated_at' => now(),
        ]], ['submission_id', 'reviewer_id'], ['score', 'note', 'updated_at']);
        return response()->json(['data' => ['saved' => true]], 200, ['Cache-Control' => 'private, no-store']);
    }

    private function assertStage(Oprec $oprec, OprecStage $stage): void
    {
        abort_unless($stage->oprec_id === $oprec->id && $stage->type === 'test_tulis', 404);
    }
}
