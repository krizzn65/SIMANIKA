<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OprecResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'periode' => $this->periode, 'status' => $this->status,
            'headline' => $this->headline ?? '', 'deskripsi' => $this->deskripsi ?? '',
            'poster' => $this->poster, 'posterAlt' => $this->poster_alt,
            'tanggalBuka' => $this->tanggal_buka?->toIso8601String(),
            'tanggalTutup' => $this->tanggal_tutup?->toIso8601String(),
            'schemaVersion' => $this->schema_version, 'formIntro' => $this->form_intro ?? '',
            'formFields' => collect($this->form_fields ?? [])->reject(fn ($field) => in_array($field['name'] ?? '', ['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3'], true))->values()->all(),
            'divisiTersedia' => $this->divisions->map(fn ($division) => [
                'id' => $division->id, 'nama' => $division->nama,
                'namaLengkap' => $division->nama_lengkap, 'deskripsi' => $division->deskripsi,
                'logo' => $division->logo, 'jabatan' => $division->jabatan ?? [],
            ])->all(),
            'pengumuman' => [
                'published' => $this->pengumuman_published,
                'tanggal' => $this->pengumuman_published ? $this->pengumuman_tanggal?->toIso8601String() : null,
                'pesan' => $this->pengumuman_published ? ($this->pengumuman_pesan ?? '') : '',
            ],
            'stages' => $this->stages->filter(fn ($stage) => $request->user()?->role === 'admin' || $stage->published)->map(fn ($stage) => [
                'id' => $stage->id, 'type' => $stage->type, 'headline' => $stage->headline,
                'deskripsi' => $stage->deskripsi, 'poster' => $stage->poster,
                'tanggalBuka' => $stage->tanggal_buka?->toIso8601String(),
                'tanggalTutup' => $stage->tanggal_tutup?->toIso8601String(), 'published' => $stage->published,
                ...($request->user()?->role === 'admin' ? ['formFields' => $stage->form_fields ?? []] : []),
            ])->values()->all(),
            'faq' => $this->faq ?? [],
        ];
    }
}
