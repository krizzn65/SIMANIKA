<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EventFormController extends Controller
{
    public function show(Event $event): EventResource
    {
        $event->load(['formFields', 'prizes', 'requirements'])->loadCount(['registrations', 'teams']);
        $event->setAttribute('enrollments_count', DB::table('event_enrollments')->where('event_id', $event->id)->count());
        return new EventResource($event);
    }

    public function save(Request $request, Event $event): EventResource
    {
        $data = $request->validate([
            'form_fields' => ['required', 'array', 'max:40'],
            'form_fields.*.name' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/'],
            'form_fields.*.label' => ['required', 'string', 'max:200'],
            'form_fields.*.type' => ['required', Rule::in(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'])],
            'form_fields.*.required' => ['required', 'boolean'],
            'form_fields.*.help' => ['nullable', 'string', 'max:500'],
            'form_fields.*.placeholder' => ['nullable', 'string', 'max:250'],
            'form_fields.*.options' => ['nullable', 'array', 'max:100'],
            'form_fields.*.options.*.value' => ['required', 'string', 'max:150'],
            'form_fields.*.options.*.label' => ['required', 'string', 'max:150'],
        ]);
        $fields = $data['form_fields'];
        $names = array_column($fields, 'name');
        if (count($names) !== count(array_unique($names))) {
            throw ValidationException::withMessages(['form_fields' => ['ID kolom harus unik.']]);
        }
        foreach ($fields as $index => $field) {
            if (in_array($field['type'], ['select', 'radio'], true)) {
                $options = $field['options'] ?? [];
                $values = array_column($options, 'value');
                if (!$options || count($values) !== count(array_unique($values))) {
                    throw ValidationException::withMessages(["form_fields.{$index}.options" => ['Pilihan wajib ada dan nilainya harus unik.']]);
                }
            }
        }
        DB::transaction(function () use ($event, $fields) {
            $locked = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
            if ($locked->registrations()->exists() || $locked->teams()->exists() || DB::table("event_enrollments")->where("event_id", $locked->id)->exists()) {
                throw ValidationException::withMessages(['form_fields' => ['Formulir tidak dapat diubah setelah ada pendaftar.']]);
            }
            $locked->formFields()->delete();
            foreach ($fields as $index => $field) {
                $locked->formFields()->create([
                    'name' => $field['name'], 'label' => $field['label'], 'type' => $field['type'],
                    'required' => $field['required'], 'help' => $field['help'] ?? null,
                    'placeholder' => $field['placeholder'] ?? null,
                    'options' => $field['options'] ?? [], 'sort_order' => $index,
                ]);
            }
        });
        return new EventResource($event->fresh(['formFields', 'prizes', 'requirements']));
    }

    public function publish(Event $event): EventResource
    {
        if (!$event->formFields()->exists()) {
            throw ValidationException::withMessages(['form_fields' => ['Tambahkan minimal satu kolom formulir sebelum mempublikasikan event.']]);
        }
        $event->update(['status' => 'published']);
        return new EventResource($event->fresh(['formFields', 'prizes', 'requirements']));
    }
}
