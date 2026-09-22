<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{
    public function index() { return EventResource::collection(Event::query()->withCount(['registrations', 'teams'])->latest()->paginate(20)); }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $event = DB::transaction(function () use ($data, $request) {
            $event = Event::create(array_merge($data['event'], ['created_by' => $request->user()->id]));
            $this->syncDetails($event, $data);
            return $event;
        });
        return (new EventResource($event->load(['prizes', 'requirements', 'formFields'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, Event $event)
    {
        $data = $this->validated($request, $event);
        DB::transaction(function () use ($event, $data) {
            $event->update($data['event']);
            $this->syncDetails($event, $data);
        });
        return new EventResource($event->fresh(['prizes', 'requirements', 'formFields']));
    }

    public function destroy(Event $event)
    {
        if ($event->registrations()->exists() || $event->teams()->exists()) return response()->json(['message' => 'Event dengan pendaftar tidak dapat dihapus. Tutup publikasinya.'], 409);
        $event->delete();
        return response()->noContent();
    }

    private function validated(Request $request, ?Event $event = null): array
    {
        $rules = [
            'slug' => ['required', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'max:160', Rule::unique('events')->ignore($event?->id)],
            'judul' => ['required', 'string', 'max:200'], 'deskripsi' => ['nullable', 'string', 'max:20000'],
            'kategori' => ['required', Rule::in(['lomba', 'seminar', 'workshop', 'lainnya'])],
            'poster' => ['nullable', 'url:http,https', 'max:2048'],
            'tanggal_mulai' => ['required', 'date'], 'tanggal_selesai' => ['required', 'date', 'after:tanggal_mulai'],
            'buka_pendaftaran' => ['nullable', 'date'], 'deadline_pendaftaran' => ['nullable', 'date', 'after:buka_pendaftaran', 'before_or_equal:tanggal_mulai'],
            'lokasi' => ['nullable', 'string', 'max:200'], 'tipe' => ['required', Rule::in(['online', 'offline', 'hybrid'])],
            'status' => ['required', Rule::in(['draft', 'published', 'closed', 'selesai'])],
            'tipe_pendaftaran' => ['required', Rule::in(['individu', 'tim'])],
            'kuota' => ['nullable', 'integer', 'min:0'], 'kuota_tim' => ['nullable', 'integer', 'min:0'],
            'kode_prefix' => ['nullable', 'regex:/^[A-Z]{1,6}$/'], 'min_anggota' => ['nullable', 'integer', 'min:2', 'max:100'],
            'max_anggota' => ['nullable', 'integer', 'gte:min_anggota', 'max:100'],
            'registration_url' => ['nullable', 'url:http,https', 'max:2048'],
            'hadiah' => ['array', 'max:20'], 'hadiah.*' => ['string', 'max:250'],
            'syarat' => ['array', 'max:30'], 'syarat.*' => ['string', 'max:250'],
            'form_fields' => ['array', 'max:40'],
            'form_fields.*.name' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/'],
            'form_fields.*.label' => ['required', 'string', 'max:200'],
            'form_fields.*.type' => ['required', Rule::in(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'])],
            'form_fields.*.required' => ['required', 'boolean'],
            'form_fields.*.options' => ['nullable', 'array', 'max:100'],
        ];
        $data = $request->validate($rules);
        $names = array_column($data['form_fields'] ?? [], 'name');
        if (count($names) !== count(array_unique($names))) throw ValidationException::withMessages(['form_fields' => ['Nama kolom harus unik.']]);
        if ($data['tipe_pendaftaran'] === 'tim' && (empty($data['kode_prefix']) || empty($data['min_anggota']) || empty($data['max_anggota']))) {
            throw ValidationException::withMessages(['teamSettings' => ['Pengaturan tim belum lengkap.']]);
        }
        $details = ['hadiah' => $data['hadiah'] ?? [], 'syarat' => $data['syarat'] ?? [], 'form_fields' => $data['form_fields'] ?? []];
        unset($data['hadiah'], $data['syarat'], $data['form_fields']);
        return ['event' => $data, ...$details];
    }

    private function syncDetails(Event $event, array $data): void
    {
        $event->prizes()->delete();
        foreach ($data['hadiah'] as $index => $label) $event->prizes()->create(['label' => $label, 'sort_order' => $index]);
        $event->requirements()->delete();
        foreach ($data['syarat'] as $index => $label) $event->requirements()->create(['label' => $label, 'sort_order' => $index]);
        $event->formFields()->delete();
        foreach ($data['form_fields'] as $index => $field) $event->formFields()->create(array_merge($field, ['sort_order' => $index]));
    }
}
