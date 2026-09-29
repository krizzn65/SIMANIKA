<?php

namespace App\Http\Controllers;

use App\Models\Oprec;
use App\Models\OprecTestSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OprecWrittenTestFileController extends Controller
{
    public function user(Request $request, Oprec $oprec, string $field)
    {
        $stage = $oprec->writtenTest()->firstOrFail();
        $submission = $stage->submissions()->where('user_id', $request->user()->id)->firstOrFail();
        return $this->download($stage, $submission, $field);
    }

    public function admin(Oprec $oprec, OprecTestSubmission $submission, string $field)
    {
        $stage = $oprec->writtenTest()->firstOrFail();
        abort_unless($submission->oprec_stage_id === $stage->id, 404);
        return $this->download($stage, $submission, $field);
    }

    private function download($stage, OprecTestSubmission $submission, string $field)
    {
        $question = collect($stage->form_fields ?? [])->firstWhere('id', $field);
        abort_unless($question && ($question['type'] ?? null) === 'file', 404);
        $value = $submission->answers[$field] ?? null;
        $path = is_array($value) ? ($value['path'] ?? null) : null;
        abort_unless(is_string($path) && str_starts_with($path, "oprec/test/{$stage->id}/") && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, basename($value['name'] ?? 'berkas'), ['Cache-Control' => 'private, no-store']);
    }
}
