<?php

namespace App\Http\Requests\Oprec;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveOprecRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin'; }

    public function rules(): array
    {
        return [
            'periode' => ['required', 'string', 'max:40', Rule::unique('oprecs')->ignore($this->route('oprec')?->id)],
            'status' => ['required', Rule::in(['open', 'closed'])],
            'headline' => ['nullable', 'string', 'max:300'], 'deskripsi' => ['nullable', 'string', 'max:5000'],
            'poster' => ['nullable', 'url:http,https', 'max:2048'], 'poster_alt' => ['nullable', 'string', 'max:250'],
            'tanggal_buka' => ['nullable', 'date'], 'tanggal_tutup' => ['nullable', 'date', 'after:tanggal_buka'],
            'schema_version' => ['required', 'string', 'max:20'], 'form_intro' => ['nullable', 'string', 'max:2000'],
            'form_fields' => ['required', 'array', 'max:40'],
            'form_fields.*.name' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/', 'max:50'],
            'form_fields.*.type' => ['required', Rule::in(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'])],
            'form_fields.*.label' => ['required', 'string', 'max:200'], 'form_fields.*.required' => ['required', 'boolean'],
            'form_fields.*.help' => ['nullable', 'string', 'max:500'], 'form_fields.*.placeholder' => ['nullable', 'string', 'max:250'],
            'form_fields.*.maxLength' => ['nullable', 'integer', 'min:1', 'max:5000'],
            'form_fields.*.maxSizeMB' => ['nullable', 'integer', 'min:1', 'max:10'],
            'form_fields.*.min' => ['nullable', 'numeric'], 'form_fields.*.max' => ['nullable', 'numeric'],
            'form_fields.*.options' => ['nullable', 'array', 'max:100'],
            'form_fields.*.options.*.value' => ['required_with:form_fields.*.options', 'string', 'max:150'],
            'form_fields.*.options.*.label' => ['required_with:form_fields.*.options', 'string', 'max:150'],
            'form_fields.*.accept' => ['nullable', 'array'], 'form_fields.*.accept.*' => [Rule::in(['.pdf', '.jpg', '.jpeg', '.png'])],
            'divisi_tersedia' => ['array', 'max:30'], 'divisi_tersedia.*.nama' => ['required', 'string', 'max:150'],
            'divisi_tersedia.*.nama_lengkap' => ['nullable', 'string', 'max:200'], 'divisi_tersedia.*.deskripsi' => ['nullable', 'string', 'max:500'],
            'divisi_tersedia.*.logo' => ['nullable', 'url:http,https', 'max:2048'], 'divisi_tersedia.*.kuota' => ['nullable', 'integer', 'min:0'],
            'faq' => ['array', 'max:40'], 'faq.*.pertanyaan' => ['required', 'string', 'max:500'], 'faq.*.jawaban' => ['required', 'string', 'max:2000'],
            'pengumuman.published' => ['required', 'boolean'], 'pengumuman.tanggal' => ['nullable', 'date'], 'pengumuman.pesan' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $fields = $this->input('form_fields', []);
            if (!is_array($fields)) return;
            $names = array_column($fields, 'name');
            if (count($names) !== count(array_unique($names))) $validator->errors()->add('form_fields', 'Nama kolom harus unik.');
            foreach (['nim' => 'text', 'tanggal_lahir' => 'date'] as $name => $type) {
                if (!collect($fields)->contains(fn ($field) => ($field['name'] ?? null) === $name && ($field['type'] ?? null) === $type && ($field['required'] ?? false))) $validator->errors()->add('form_fields', "Kolom {$name} wajib tersedia.");
            }
            if (count(array_intersect($names, ['oprec_id', 'schema_version', '__proto__', 'constructor', 'prototype']))) $validator->errors()->add('form_fields', 'Nama kolom terlarang.');
            foreach ($fields as $index => $field) {
                if (in_array($field['type'] ?? '', ['select', 'radio'], true) && empty($field['options'])) $validator->errors()->add("form_fields.{$index}.options", 'Pilihan wajib diisi.');
                if (in_array($field['type'] ?? '', ['select', 'radio'], true)) {
                    $values = array_column($field['options'] ?? [], 'value');
                    if (count($values) !== count(array_unique($values))) $validator->errors()->add("form_fields.{$index}.options", 'Nilai pilihan harus unik.');
                }
                if (isset($field['min'], $field['max']) && (float) $field['min'] > (float) $field['max']) $validator->errors()->add("form_fields.{$index}.min", 'Batas minimum melebihi maksimum.');
            }
            if ($this->boolean('pengumuman.published') && $this->input('status') !== 'closed') $validator->errors()->add('pengumuman.published', 'Tutup pendaftaran sebelum menerbitkan pengumuman.');
        });
    }
}
