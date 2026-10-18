<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Support\OprecRegistrationFields;

class OprecResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'periode' => $this->periode, 'status' => $this->status,
            'headline' => $this->headline ?? '', 'deskripsi' => $this->deskripsi ?? '',
            'poster' => $this->poster, 'posterAlt' => $this->poster_alt,
            'guidebook' => $this->guidebook ? route('public.oprec-guidebook', ['oprec' => $this->id]) : null,
            'guidebookPath' => $request->is('api/admin/*') && in_array($request->user()?->effectiveRole(), ['super_admin', 'admin'], true) ? $this->guidebook : null,
            'tanggalBuka' => $this->tanggal_buka?->toIso8601String(),
            'tanggalTutup' => $this->tanggal_tutup?->toIso8601String(),
            'schemaVersion' => $this->schema_version, 'formIntro' => $this->form_intro ?? '',
            'linkGrupWa' => $request->is('api/admin/*') && in_array($request->user()?->effectiveRole(), ['super_admin', 'admin'], true) ? $this->link_grup_wa : null,
            'formFields' => collect(OprecRegistrationFields::withDefaults($this->form_fields ?? []))
                ->reject(fn ($field) => in_array($field['name'] ?? '', ['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3'], true))
                ->map(function ($field) use ($request) {
                    $admin = $request->is('api/admin/*') && in_array($request->user()?->effectiveRole(), ['super_admin', 'admin'], true);
                    $fileUrl = !empty($field['example_file']) ? route('public.oprec-example', ['oprec' => $this->id, 'field' => $field['name']]) : null;
                    return array_merge($field, [
                        'target_type' => $field['target_type'] ?? 'all',
                        'targetType' => $field['target_type'] ?? 'all',
                        'target_divisions' => $field['target_divisions'] ?? [],
                        'targetDivisions' => $field['target_divisions'] ?? [],
                        'example_file' => $admin ? ($field['example_file'] ?? null) : null,
                        'example_file_name' => $admin ? ($field['example_file_name'] ?? null) : null,
                        'exampleFileName' => $admin ? ($field['example_file_name'] ?? null) : null,
                        'example_file_url' => $fileUrl,
                        'exampleFileUrl' => $fileUrl,
                        'exampleLabel' => $field['example_label'] ?? null,
                    ]);
                })
                ->values()->all(),
            'divisiTersedia' => $this->divisions->map(fn ($division) => [
                'id' => $division->id, 'nama' => $division->nama,
                'namaLengkap' => $division->nama_lengkap, 'deskripsi' => $division->deskripsi,
                'logo' => $division->logo, 'jabatan' => $division->jabatan ?? [],
            ])->all(),
            'pengumuman' => [
                'published' => $this->pengumuman_published,
                'tanggal' => $this->pengumuman_published ? $this->pengumuman_tanggal?->toIso8601String() : null,
                'pesan' => ($request->is('api/admin/*') || (($this->status === 'closed'
                    || ($this->tanggal_tutup && $this->tanggal_tutup->isPast()))
                    && $this->pengumuman_published
                    && (!$this->pengumuman_tanggal || $this->pengumuman_tanggal->isPast())))
                    ? ($this->pengumuman_pesan ?? '') : '',
            ],
            'announcement' => $this->pengumuman_published ? app(\App\Services\OprecAnnouncementService::class)->metadata($this->resource) : null,
            'serverNow' => now()->toIso8601String(),
            'faq' => $this->faq ?? [],
        ];
    }
}
