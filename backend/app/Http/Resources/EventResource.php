<?php

namespace App\Http\Resources;

use App\Support\EventGuidebookSource;
use App\Support\EventTimeline;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    private function posterUrl(): ?string
    {
        if (!$this->poster) return null;
        $path = parse_url($this->poster, PHP_URL_PATH);
        if (is_string($path) && preg_match("~^/(?:storage/)?events/posters/([A-Za-z0-9_-]+\\.(?:jpe?g|png|webp))$~i", $path, $match)) {
            return route("public.event-poster", ["filename" => $match[1]]);
        }
        if (is_string($path) && preg_match("~^/api/public/events/posters/([A-Za-z0-9_-]+\\.(?:jpe?g|png|webp))$~i", $path, $match)) {
            return route("public.event-poster", ["filename" => $match[1]]);
        }
        return $this->poster;
    }

    public function toArray(Request $request): array
    {
        $team = $this->tipe_pendaftaran === 'tim';
        [$registrationOpen, $registrationClose, $registrationBatch, $registrationBatchCount] = EventTimeline::registrationTimes($this->resource);

        return [
            'id' => $this->id, 'slug' => $this->slug, 'judul' => $this->judul,
            'deskripsi' => $this->deskripsi ?? '', 'kategori' => $this->kategori,
            'poster' => $this->posterUrl(),
            'guidebookType' => $this->guidebook_type,
            'guidebookValue' => $this->guidebook_value,
            'guidebookUrl' => EventGuidebookSource::url($this->guidebook_type, $this->guidebook_value), 'tanggalMulai' => $this->tanggal_mulai?->format('Y-m-d'),
            'tanggalSelesai' => $this->tanggal_selesai?->format('Y-m-d'),
            'bukaPendaftaran' => $registrationOpen?->format('Y-m-d'),
            'deadlinePendaftaran' => $registrationClose?->format('Y-m-d'),
            'registrationBatch' => $registrationBatch,
            'registrationBatchCount' => $registrationBatchCount,
            'timeline' => $this->timeline ?? [],
            'lokasi' => $this->lokasi, 'tipe' => $this->tipe, 'status' => $this->status,
            'tipePendaftaran' => $this->tipe_pendaftaran,
            'tipe_pendaftaran' => $this->tipe_pendaftaran,
            'paymentType' => $this->payment_type ?? 'free',
            'payment_type' => $this->payment_type ?? 'free',
            'htm' => $this->payment_type === 'paid' ? $this->htm : null,
            'tanggal_mulai' => $this->tanggal_mulai?->format('Y-m-d'),
            'tanggal_selesai' => $this->tanggal_selesai?->format('Y-m-d'),
            'buka_pendaftaran' => $registrationOpen?->format('Y-m-d'),
            'deadline_pendaftaran' => $registrationClose?->format('Y-m-d'),
            'kode_prefix' => $this->kode_prefix,
            'min_anggota' => $this->min_anggota,
            'max_anggota' => $this->max_anggota,
            'registrations_count' => $this->registrations_count ?? 0,
            'teams_count' => $this->teams_count ?? 0,
            'enrollments_count' => $this->enrollments_count ?? 0,
            'teamSettings' => $team ? ['minAnggota' => $this->min_anggota, 'maxAnggota' => $this->max_anggota] : null,
            'syarat' => $this->whenLoaded('requirements', fn () => $this->requirements->pluck('label')->all(), []),
            'hadiah' => $this->whenLoaded('prizes', fn () => $this->prizes->pluck('label')->all(), []),
            'formFields' => $this->whenLoaded('formFields', fn () => $this->formFields->map(fn ($field) => ['name' => $field->name, 'label' => $field->label, 'type' => $field->type, 'required' => $field->required, 'options' => $field->options ?? [], 'help' => $field->help, 'placeholder' => $field->placeholder])->all(), []),
            'formGroups' => $this->whenLoaded('formGroups', fn () => $this->formGroups->map(fn ($group) => [
                'id' => $group->id, 'title' => $group->title, 'scope' => $group->scope,
                'editRole' => $group->edit_role,
                'fields' => $group->fields->map(fn ($field) => [
                    'name' => $field->name, 'label' => $field->label, 'type' => $field->type,
                    'required' => $field->required, 'options' => $field->options ?? [],
                    'help' => $field->help, 'placeholder' => $field->placeholder,
                ])->all(),
            ])->all(), []),
        ];
    }
}
