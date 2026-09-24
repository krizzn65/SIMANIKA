<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\TeamMembershipService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EventRegistrationController extends Controller
{
    public function store(Request $request, Event $event)
    {
        abort_unless($event->status === 'published', 404);
        if (($event->buka_pendaftaran && today()->lt($event->buka_pendaftaran)) ||
            ($event->deadline_pendaftaran && today()->gt($event->deadline_pendaftaran)) ||
            ($event->tanggal_selesai && today()->gt($event->tanggal_selesai))) {
            return response()->json(['message' => 'Pendaftaran event belum dibuka atau sudah ditutup.'], 409);
        }
        if ($event->tipe_pendaftaran === 'tim') {
            $membership = DB::table('team_members')->where('event_id', $event->id)->where('user_id', $request->user()->id)->first();
            $team = $membership ? $event->teams()->find($membership->team_id) : null;
            abort_unless($team && (int) $team->ketua_id === (int) $request->user()->id, 403, 'Hanya ketua tim yang dapat mengisi formulir tim.');
        }
        $fields = $event->formFields()->get();
        if ($fields->isEmpty()) return response()->json(['message' => 'Formulir event belum tersedia.'], 409);

        $rules = [];
        foreach ($fields as $field) {
            $rule = [$field->required ? 'required' : 'nullable'];
            if ($field->type === 'file') {
                array_push($rule, 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:5120');
            } elseif ($field->type === 'checkbox') {
                $rule[] = Rule::in(['on', '1']);
            } else {
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
        $totalBytes = collect($data)->filter(fn ($value) => $value instanceof \Illuminate\Http\UploadedFile)->sum(fn ($file) => $file->getSize());
        if ($totalBytes > 11 * 1024 * 1024) throw ValidationException::withMessages(['event' => ['Total berkas maksimal 11 MB.']]);
        $stored = [];
        try {
            DB::transaction(function () use ($request, $event, $data, $fields, &$stored) {
                $locked = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
                if ($locked->status !== 'published' ||
                    ($locked->buka_pendaftaran && today()->lt($locked->buka_pendaftaran)) ||
                    ($locked->deadline_pendaftaran && today()->gt($locked->deadline_pendaftaran)) ||
                    ($locked->tanggal_selesai && today()->gt($locked->tanggal_selesai))) {
                    throw ValidationException::withMessages(['event' => ['Pendaftaran sudah berubah. Muat ulang halaman.']]);
                }
                $team = null;
                if ($locked->tipe_pendaftaran === 'tim') {
                    $team = $locked->teams()->where('ketua_id', $request->user()->id)->lockForUpdate()->first();
                    abort_unless($team, 403);
                    app(TeamMembershipService::class)->ensureOpen($locked, $team);
                    if ($team->form_submitted_at) {
                        throw ValidationException::withMessages(['event' => ['Formulir tim sudah dikirim.']]);
                    }
                }
                $answers = [];
                foreach ($fields as $field) {
                    if (!array_key_exists($field->name, $data)) continue;
                    $value = $data[$field->name];
                    if ($field->type === 'file' && $value !== null) {
                        $path = $value->store("events/{$event->id}", 'local');
                        if (!$path) throw new \RuntimeException('File storage failed');
                        $stored[] = $path;
                        $answers[$field->name] = $path;
                    } else {
                        $answers[$field->name] = is_string($value) ? trim($value) : $value;
                    }
                }
                if ($locked->tipe_pendaftaran === 'tim') {
                    $team->update(['form_data' => $answers, 'form_submitted_at' => now()]);
                } else {
                    $locked->registrations()->create(['user_id' => $request->user()->id, 'form_data' => $answers]);
                }
            });
        } catch (UniqueConstraintViolationException $error) {
            if ($stored) Storage::disk('local')->delete($stored);
            return response()->json(['message' => 'Kamu sudah terdaftar di event ini.'], 409);
        } catch (\Throwable $error) {
            if ($stored) Storage::disk('local')->delete($stored);
            throw $error;
        }
        return response()->json(['data' => ['submitted' => true]], 201);
    }
}
