<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventWorkspaceResource;
use App\Models\Event;
use App\Services\EventWorkspaceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventWorkspaceController extends Controller
{
    public function show(Request $request, Event $event, EventWorkspaceService $workspace)
    {
        return (new EventWorkspaceResource($workspace->data($event, $request->user()->id)))
            ->response()->header('Cache-Control', 'private, no-store');
    }

    public function download(Request $request, Event $event, string $field, EventWorkspaceService $workspace)
    {
        $context = $workspace->context($event, $request->user()->id);
        abort_unless($event->tipe_pendaftaran === 'individu' || $context['accepted'], 403);
        abort_unless($event->formFields()->where('name', $field)->where('type', 'file')->exists(), 404);
        $record = $context['team'] ?: $context['registration'];
        $path = ($record?->form_data ?? [])[$field] ?? null;
        abort_unless(is_string($path) && str_starts_with($path, "events/{$event->id}/")
            && !str_contains($path, '..') && Storage::disk('local')->exists($path), 404);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        return Storage::disk('local')->download($path, "{$field}.{$extension}", [
            'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
