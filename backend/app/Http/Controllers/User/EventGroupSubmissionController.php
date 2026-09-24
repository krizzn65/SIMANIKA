<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventFormGroup;
use App\Services\EventWorkspaceService;
use App\Services\TeamMembershipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EventGroupSubmissionController extends Controller
{
    public function store(Request $request, Event $event, EventFormGroup $group, EventWorkspaceService $workspace)
    {
        abort_unless($group->event_id === $event->id, 404);
        $context = $workspace->context($event, $request->user()->id);
        abort_unless($event->tipe_pendaftaran !== 'tim' || $context['accepted'], 403);
        $team = $context['team'];
        if ($group->scope === 'team') {
            abort_unless($team, 403);
            abort_unless($group->edit_role !== 'leader' || $context['isLeader'], 403);
        }
        app(TeamMembershipService::class)->ensureOpen($event, $team);
        $fields = $group->fields()->get();
        abort_if($fields->isEmpty(), 409, 'Grup formulir belum memiliki pertanyaan.');
        $rules = [];
        foreach ($fields as $field) {
            $rule = [$field->type === 'file' ? 'nullable' : ($field->required ? 'required' : 'nullable')];
            if ($field->type === 'file') array_push($rule, 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120');
            elseif ($field->type === 'checkbox') $rule[] = Rule::in(['on', '1']);
            else {
                array_push($rule, 'string', 'max:5000');
                if ($field->type === 'email') $rule[] = 'email';
                if ($field->type === 'date') $rule[] = 'date_format:Y-m-d';
                if ($field->type === 'number') $rule[] = 'numeric';
                if ($field->type === 'tel') $rule[] = 'regex:/^[0-9+() .-]{5,30}$/';
                if (in_array($field->type, ['select', 'radio'], true)) $rule[] = Rule::in(array_column($field->options ?? [], 'value'));
            }
            $rules[$field->name] = $rule;
        }
        $data = $request->validate($rules);
        $bytes = collect($data)->filter(fn ($value) => $value instanceof \Illuminate\Http\UploadedFile)->sum(fn ($file) => $file->getSize());
        if ($bytes > 11 * 1024 * 1024) throw ValidationException::withMessages(['group' => ['Total berkas maksimal 11 MB.']]);

        $stored = [];
        $oldFiles = [];
        try {
            DB::transaction(function () use ($request, $event, $group, $team, $context, $fields, $data, &$stored, &$oldFiles) {
                $locked = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
                app(TeamMembershipService::class)->ensureOpen($locked, $team);
                if ($team) {
                    $membership = DB::table('team_members')->where('event_id', $locked->id)
                        ->where('team_id', $team->id)->where('user_id', $request->user()->id)->first();
                    abort_unless($membership?->status === 'accepted', 403);
                    if ($group->scope === 'team' && $group->edit_role === 'leader') {
                        abort_unless((int) $team->ketua_id === (int) $request->user()->id, 403);
                    }
                } else {
                    abort_unless(DB::table('event_enrollments')->where('event_id', $locked->id)
                        ->where('user_id', $request->user()->id)->exists(), 403);
                }
                $ownerType = $group->scope === 'team' ? 'team' : 'user';
                $ownerId = $ownerType === 'team' ? $team->id : $request->user()->id;
                $existing = DB::table('event_group_submissions')->where('group_id', $group->id)
                    ->where('owner_type', $ownerType)->where('owner_id', $ownerId)->lockForUpdate()->first();
                $previous = $existing ? json_decode($existing->form_data, true) : [];
                $answers = [];
                foreach ($fields as $field) {
                    $value = $data[$field->name] ?? null;
                    if ($field->type === 'file') {
                        if ($value) {
                            $path = $value->store("events/{$event->id}/groups/{$group->id}", 'local');
                            if (!$path) throw new \RuntimeException('File storage failed');
                            $stored[] = $path;
                            if (!empty($previous[$field->name])) $oldFiles[] = $previous[$field->name];
                            $answers[$field->name] = $path;
                        } elseif (!empty($previous[$field->name])) $answers[$field->name] = $previous[$field->name];
                        elseif ($field->required) throw ValidationException::withMessages([$field->name => ['Berkas wajib diunggah.']]);
                    } elseif ($value !== null) $answers[$field->name] = is_string($value) ? trim($value) : $value;
                }
                if ($existing) DB::table('event_group_submissions')->where('id', $existing->id)
                    ->update(['form_data' => json_encode($answers), 'updated_at' => now()]);
                else DB::table('event_group_submissions')->insert([
                    'event_id' => $event->id, 'group_id' => $group->id, 'owner_type' => $ownerType,
                    'owner_id' => $ownerId, 'form_data' => json_encode($answers),
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            });
        } catch (\Throwable $error) {
            if ($stored) Storage::disk('local')->delete($stored);
            throw $error;
        }
        if ($oldFiles) Storage::disk('local')->delete($oldFiles);
        return response()->json(['data' => ['submitted' => true]]);
    }

    public function download(Request $request, Event $event, EventFormGroup $group, string $field, EventWorkspaceService $workspace)
    {
        abort_unless($group->event_id === $event->id, 404);
        $context = $workspace->context($event, $request->user()->id);
        abort_unless($event->tipe_pendaftaran !== 'tim' || $context['accepted'], 403);
        abort_unless($group->fields()->where('name', $field)->where('type', 'file')->exists(), 404);
        $ownerType = $group->scope === 'team' ? 'team' : 'user';
        $ownerId = $ownerType === 'team' ? $context['team']?->id : $request->user()->id;
        abort_unless($ownerId, 403);
        $record = DB::table('event_group_submissions')->where('group_id', $group->id)
            ->where('owner_type', $ownerType)->where('owner_id', $ownerId)->first();
        $path = ($record ? json_decode($record->form_data, true) : [])[$field] ?? null;
        abort_unless(is_string($path) && str_starts_with($path, "events/{$event->id}/groups/{$group->id}/")
            && !str_contains($path, '..') && Storage::disk('local')->exists($path), 404);
        return Storage::disk('local')->download($path, "{$field}.".pathinfo($path, PATHINFO_EXTENSION),
            ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
