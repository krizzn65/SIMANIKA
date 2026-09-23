<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
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
                $answers = [];
                foreach ($fields as $field) {
                    if (!array_key_exists($field->name, $data)) continue;
                    $value = $data[$field->name];
                    if ($field->type === 'file') {
                        $path = $value->store("events/{$event->id}", 'local');
                        if (!$path) throw new \RuntimeException('File storage failed');
                        $stored[] = $path;
                        $answers[$field->name] = $path;
                    } else {
                        $answers[$field->name] = is_string($value) ? trim($value) : $value;
                    }
                }
                if ($locked->tipe_pendaftaran === 'tim') {
                    if (DB::table('team_members')->where('event_id', $locked->id)->where('user_id', $request->user()->id)->exists()) {
                        throw ValidationException::withMessages(['event' => ['Kamu sudah terdaftar pada tim event ini.']]);
                    }
                    $number = $locked->last_team_number + 1;
                    $locked->last_team_number = $number;
                    $locked->save();
                    $team = $locked->teams()->create([
                        'kode_unik' => ($locked->kode_prefix ?: 'TEAM').str_pad((string) $number, 2, '0', STR_PAD_LEFT),
                        'nama_tim' => mb_substr(trim((string) ($answers['nama_tim'] ?? '')) ?: 'Tim '.$number, 0, 255),
                        'ketua_id' => $request->user()->id,
                        'jumlah_anggota' => 1,
                        'form_data' => $answers,
                    ]);
                    DB::table('team_members')->insert([
                        'team_id' => $team->id, 'event_id' => $locked->id,
                        'user_id' => $request->user()->id, 'joined_at' => now(),
                    ]);
                } else {
                    $locked->registrations()->create(['user_id' => $request->user()->id, 'form_data' => $answers]);
                }
            });
        } catch (UniqueConstraintViolationException $error) {
            Storage::disk('local')->delete($stored);
            return response()->json(['message' => 'Kamu sudah terdaftar di event ini.'], 409);
        } catch (\Throwable $error) {
            Storage::disk('local')->delete($stored);
            throw $error;
        }
        return response()->json(['data' => ['submitted' => true]], 201);
    }
}
