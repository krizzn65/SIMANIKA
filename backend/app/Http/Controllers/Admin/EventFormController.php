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
        $event->load(['formFields', 'formGroups.fields', 'prizes', 'requirements'])->loadCount(['registrations', 'teams']);
        $event->setAttribute('enrollments_count', DB::table('event_enrollments')->where('event_id', $event->id)->count());
        return new EventResource($event);
    }

    public function save(Request $request, Event $event): EventResource
    {
        $data = $request->validate([
            'form_fields' => ['required_without:form_groups', 'array', 'max:40'],
            'form_groups' => ['required_without:form_fields', 'array', 'min:1', 'max:20'],
            'form_groups.*.title' => ['required', 'string', 'max:150'],
            'form_groups.*.scope' => ['required', Rule::in(['personal', 'team'])],
            'form_groups.*.edit_role' => ['required', Rule::in(['all', 'leader'])],
            'form_groups.*.fields' => ['required', 'array', 'min:1', 'max:40'],
            'form_groups.*.fields.*.name' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/'],
            'form_groups.*.fields.*.label' => ['required', 'string', 'max:200'],
            'form_groups.*.fields.*.type' => ['required', Rule::in(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'])],
            'form_groups.*.fields.*.required' => ['required', 'boolean'],
            'form_groups.*.fields.*.help' => ['nullable', 'string', 'max:500'],
            'form_groups.*.fields.*.placeholder' => ['nullable', 'string', 'max:250'],
            'form_groups.*.fields.*.options' => ['nullable', 'array', 'max:100'],
            'form_groups.*.fields.*.options.*.value' => ['required', 'string', 'max:150'],
            'form_groups.*.fields.*.options.*.label' => ['required', 'string', 'max:150'],
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
        $groups = $data['form_groups'] ?? null;
        if ($groups !== null && $event->tipe_pendaftaran !== 'tim' && collect($groups)->contains(fn ($group) => $group['scope'] === 'team')) {
            throw ValidationException::withMessages(['form_groups' => ['Grup bersama hanya tersedia untuk event tim.']]);
        }
        if ($groups !== null && collect($groups)->contains(fn ($group) => trim($group['title']) === '')) {
            throw ValidationException::withMessages(['form_groups' => ['Nama grup wajib diisi.']]);
        }
        $fields = $groups !== null ? collect($groups)->flatMap(fn ($group) => $group['fields'])->all() : ($data['form_fields'] ?? []);
        if (count($fields) > 40) throw ValidationException::withMessages(['form_groups' => ['Maksimal 40 kolom untuk satu event.']]);
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
        DB::transaction(function () use ($event, $fields, $groups) {
            $locked = Event::whereKey($event->id)->lockForUpdate()->firstOrFail();
            if ($locked->registrations()->exists() || $locked->teams()->exists() || DB::table("event_enrollments")->where("event_id", $locked->id)->exists()) {
                throw ValidationException::withMessages(['form_fields' => ['Formulir tidak dapat diubah setelah ada pendaftar.']]);
            }
            $locked->formFields()->delete();
            $locked->formGroups()->delete();
            $writeField = function ($field, $index, $groupId = null) use ($locked) {
                $locked->formFields()->create([
                    'group_id' => $groupId,
                    'name' => $field['name'], 'label' => $field['label'], 'type' => $field['type'],
                    'required' => $field['required'], 'help' => $field['help'] ?? null,
                    'placeholder' => $field['placeholder'] ?? null,
                    'options' => $field['options'] ?? [], 'sort_order' => $index,
                ]);
            };
            if ($groups !== null) {
                foreach ($groups as $groupIndex => $group) {
                    $created = $locked->formGroups()->create([
                        'title' => trim($group['title']), 'scope' => $group['scope'],
                        'edit_role' => $group['scope'] === 'personal' ? 'all' : $group['edit_role'],
                        'sort_order' => $groupIndex,
                    ]);
                    foreach ($group['fields'] as $index => $field) $writeField($field, $index, $created->id);
                }
            } else {
                foreach ($fields as $index => $field) $writeField($field, $index);
            }
        });
        return new EventResource($event->fresh(['formFields', 'formGroups.fields', 'prizes', 'requirements']));
    }

    public function publish(Event $event): EventResource
    {
        if (!$event->formFields()->exists()) {
            throw ValidationException::withMessages(['form_fields' => ['Tambahkan minimal satu kolom formulir sebelum mempublikasikan event.']]);
        }
        $event->update(['status' => 'published']);
        return new EventResource($event->fresh(['formFields', 'formGroups.fields', 'prizes', 'requirements']));
    }
}
