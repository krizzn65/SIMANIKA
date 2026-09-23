<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Support\Facades\Storage;

class EventRegistrantController extends Controller
{
    public function index(Event $event)
    {
        $fields = $event->formFields()->get()->keyBy('name');
        $records = $event->tipe_pendaftaran === 'tim'
            ? $event->teams()->with('ketua:id,name,email')->latest()->paginate(20)
            : $event->registrations()->with('user:id,name,email')->latest()->paginate(20);

        return response()->json($records->through(function ($record) use ($fields, $event) {
            $answers = [];
            $files = [];
            foreach (($record->form_data ?? []) as $name => $value) {
                $field = $fields->get($name);
                if (!$field) continue;
                if ($field->type === 'file') {
                    $files[$name] = route('admin.event-file', ['event' => $event->id, 'kind' => $event->tipe_pendaftaran === 'tim' ? 'tim' : 'individu', 'id' => $record->id, 'field' => $name]);
                } else {
                    $answers[$name] = $value;
                }
            }
            return [
                'id' => $record->id,
                'name' => $event->tipe_pendaftaran === 'tim' ? $record->nama_tim : $record->user?->name,
                'email' => $event->tipe_pendaftaran === 'tim' ? $record->ketua?->email : $record->user?->email,
                'status' => $event->tipe_pendaftaran === 'tim' ? $record->review_status : $record->status,
                'answers' => $answers, 'files' => $files,
                'createdAt' => $record->created_at?->toIso8601String(),
            ];
        }));
    }

    public function download(Event $event, string $kind, int $id, string $field)
    {
        abort_unless(in_array($kind, ['tim', 'individu'], true) && preg_match('/^[a-z][a-z0-9_]{0,49}$/', $field), 404);
        $record = $kind === 'tim' ? $event->teams()->findOrFail($id) : $event->registrations()->findOrFail($id);
        abort_unless($event->formFields()->where('name', $field)->where('type', 'file')->exists(), 404);
        $path = ($record->form_data ?? [])[$field] ?? null;
        abort_unless(is_string($path) && str_starts_with($path, "events/{$event->id}/") && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, "event-{$event->id}-{$id}-{$field}", ['Cache-Control' => 'private, no-store']);
    }
}
