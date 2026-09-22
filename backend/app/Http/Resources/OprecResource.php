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
            'formFields' => $this->form_fields ?? [],
            'divisiTersedia' => $this->divisions->map(fn ($division) => [
                'id' => $division->id, 'nama' => $division->nama,
                'namaLengkap' => $division->nama_lengkap, 'deskripsi' => $division->deskripsi,
                'logo' => $division->logo, 'kuota' => $division->kuota,
            ])->all(),
            'pengumuman' => [
                'published' => $this->pengumuman_published,
                'tanggal' => $this->pengumuman_published ? $this->pengumuman_tanggal?->toIso8601String() : null,
                'pesan' => $this->pengumuman_published ? ($this->pengumuman_pesan ?? '') : '',
            ],
            'faq' => $this->faq ?? [],
        ];
    }
}
