<?php

namespace App\Http\Controllers\User;

use Illuminate\Support\Facades\DB;

class EventEnrollmentDashboard
{
    public static function items(int $userId, array $completedIds)
    {
        return DB::table('event_enrollments')
            ->join('events', 'events.id', '=', 'event_enrollments.event_id')
            ->where('event_enrollments.user_id', $userId)
            ->where('events.status', '!=', 'selesai')
            ->whereDate('events.tanggal_selesai', '>=', today())
            ->when($completedIds, fn ($query) => $query->whereNotIn('events.id', $completedIds))
            ->select('event_enrollments.id', 'event_enrollments.event_id', 'event_enrollments.created_at',
                'events.slug', 'events.judul', 'events.kategori', 'events.tanggal_mulai',
                'events.buka_pendaftaran', 'events.deadline_pendaftaran', 'events.status', 'events.tipe_pendaftaran')
            ->latest('event_enrollments.created_at')
            ->get()
            ->map(function ($enrollment) {
                $fields = DB::table('event_form_fields')->where('event_id', $enrollment->event_id)
                    ->orderBy('sort_order')->get(['name', 'label', 'type', 'required', 'options', 'help', 'placeholder'])
                    ->map(fn ($field) => [
                        'name' => $field->name, 'label' => $field->label, 'type' => $field->type,
                        'required' => $field->required,
                        'options' => is_string($field->options) ? (json_decode($field->options, true) ?: []) : ($field->options ?: []),
                        'help' => $field->help, 'placeholder' => $field->placeholder,
                    ])->all();

                return [
                    'key' => 'enrollment-'.$enrollment->id,
                    'kind' => $enrollment->tipe_pendaftaran === 'tim' ? 'team' : 'event',
                    'title' => $enrollment->judul,
                    'subtitle' => $enrollment->kategori,
                    'status' => 'incomplete',
                    'href' => '/events/'.$enrollment->slug,
                    'date' => $enrollment->tanggal_mulai,
                    'registeredAt' => $enrollment->created_at,
                    'eventId' => $enrollment->event_id,
                    'actionRequired' => true,
                    'canSubmit' => $enrollment->status === 'published'
                        && (!$enrollment->buka_pendaftaran || $enrollment->buka_pendaftaran <= today()->toDateString())
                        && (!$enrollment->deadline_pendaftaran || $enrollment->deadline_pendaftaran >= today()->toDateString()),
                    'event' => [
                        'id' => $enrollment->event_id,
                        'judul' => $enrollment->judul,
                        'tipePendaftaran' => $enrollment->tipe_pendaftaran,
                        'formFields' => $fields,
                    ],
                ];
            });
    }
}
