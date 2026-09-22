<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $team = $this->tipe_pendaftaran === 'tim';
        $capacity = $team ? $this->kuota_tim : $this->kuota;
        $used = $team ? ($this->teams_count ?? 0) : ($this->registrations_count ?? 0);
        $remaining = $capacity === null ? null : max(0, $capacity - $used);
        $canRegister = $this->status === 'published'
            && $this->tanggal_selesai?->isFuture()
            && (!$this->buka_pendaftaran || $this->buka_pendaftaran->isPast())
            && (!$this->deadline_pendaftaran || $this->deadline_pendaftaran->isFuture())
            && ($remaining === null || $remaining > 0);

        return [
            'id' => $this->id, 'slug' => $this->slug, 'judul' => $this->judul,
            'deskripsi' => $this->deskripsi ?? '', 'kategori' => $this->kategori,
            'poster' => $this->poster, 'tanggalMulai' => $this->tanggal_mulai?->toIso8601String(),
            'tanggalSelesai' => $this->tanggal_selesai?->toIso8601String(),
            'bukaPendaftaran' => $this->buka_pendaftaran?->toIso8601String(),
            'deadlinePendaftaran' => $this->deadline_pendaftaran?->toIso8601String(),
            'lokasi' => $this->lokasi, 'tipe' => $this->tipe, 'status' => $this->status,
            'tipePendaftaran' => $this->tipe_pendaftaran, 'kuota' => $capacity,
            'sisaKuota' => $remaining,
            'teamSettings' => $team ? ['minAnggota' => $this->min_anggota, 'maxAnggota' => $this->max_anggota, 'kuotaTim' => $this->kuota_tim] : null,
            'syarat' => $this->whenLoaded('requirements', fn () => $this->requirements->pluck('label')->all(), []),
            'hadiah' => $this->whenLoaded('prizes', fn () => $this->prizes->pluck('label')->all(), []),
            'formFields' => $this->whenLoaded('formFields', fn () => $this->formFields->map(fn ($field) => ['name' => $field->name, 'label' => $field->label, 'type' => $field->type, 'required' => $field->required, 'options' => $field->options ?? []])->all(), []),
            'registrationUrl' => $canRegister ? $this->registration_url : null,
        ];
    }
}
