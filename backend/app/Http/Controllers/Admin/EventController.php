<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Support\EventGuidebookSource;
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
        $data['event']['status'] = 'draft';
        $userId = $request->user()?->id ?? auth()->id() ?? auth('sanctum')->id();
        $event = DB::transaction(function () use ($data, $userId) {
            $event = Event::create(array_merge($data['event'], ['created_by' => $userId]));
            $this->syncDetails($event, $data);
            return $event;
        });
        return (new EventResource($event->load(['prizes', 'requirements', 'formFields'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, Event $event)
    {
        $data = $this->validated($request, $event);
        if ($data['event']['status'] === 'published' && !$event->formFields()->exists()) {
            throw ValidationException::withMessages(['status' => ['Susun formulir pendaftaran sebelum mempublikasikan event.']]);
        }
        if ($event->tipe_pendaftaran !== $data['event']['tipe_pendaftaran'] && ($event->registrations()->exists() || $event->teams()->exists() || DB::table("event_enrollments")->where("event_id", $event->id)->exists())) {
            throw ValidationException::withMessages(['tipe_pendaftaran' => ['Mode pendaftaran tidak dapat diubah setelah ada pendaftar atau tim.']]);
        }

        DB::transaction(function () use ($event, $data) {
            $event->update($data['event']);
            $this->syncDetails($event, $data);
        });
        return new EventResource($event->fresh(['prizes', 'requirements', 'formFields']));
    }

    public function destroy(Event $event)
    {
        if ($event->registrations()->exists() || $event->teams()->exists() || DB::table("event_enrollments")->where("event_id", $event->id)->exists()) return response()->json(['message' => 'Event dengan pendaftar tidak dapat dihapus. Tutup publikasinya.'], 409);
        $event->delete();
        return response()->noContent();
    }

    public function uploadPoster(Request $request)
    {
        $request->validate([
            'poster' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('poster')->store('events/posters', 'public');
        $url = route('public.event-poster', ['filename' => basename($path)]);

        return response()->json([
            'status' => 'success',
            'url' => $url,
            'path' => '/storage/' . $path,
        ]);
    }

    private function validated(Request $request, ?Event $event = null): array
    {
        // Support nested 'event' payload from frontend if provided
        if ($request->has('event') && is_array($request->input('event'))) {
            $request->merge($request->input('event'));
        }

        // Support direct file upload for poster
        if ($request->hasFile('poster')) {
            $path = $request->file('poster')->store('events/posters', 'public');
            $request->merge(['poster' => '/storage/' . $path]);
        }

        // Auto-generate slug from judul if not provided or empty
        if (!$request->filled('slug') && $request->filled('judul')) {
            $baseSlug = \Illuminate\Support\Str::slug($request->input('judul'));
            $request->merge(['slug' => $baseSlug ?: 'event-' . time()]);
        }

        // Auto-derive dates from timeline if not explicitly provided
        if ($request->has('timeline') && is_array($request->input('timeline'))) {
            $rawTimeline = $request->input('timeline');
            $cleanedTimeline = [];
            foreach ($rawTimeline as $item) {
                if (is_array($item)) {
                    if (isset($item['tanggal']) && is_string($item['tanggal'])) {
                        $item['tanggal'] = substr(trim($item['tanggal']), 0, 10);
                    }
                    $cleanedTimeline[] = $item;
                }
            }
            $request->merge(['timeline' => $cleanedTimeline]);

            $validItems = array_values(array_filter($cleanedTimeline, fn($i) => !empty($i['tanggal'])));
            usort($validItems, fn($a, $b) => strcmp($a['tanggal'], $b['tanggal']));

            if (!empty($validItems)) {
                if (!$request->filled('buka_pendaftaran')) {
                    foreach ($validItems as $item) {
                        $judul = mb_strtolower($item['judul'] ?? '');
                        if (str_contains($judul, 'buka') || str_contains($judul, 'awal') || str_contains($judul, 'pembukaan')) {
                            $request->merge(['buka_pendaftaran' => substr($item['tanggal'], 0, 10)]);
                            break;
                        }
                    }
                } else {
                    $request->merge(['buka_pendaftaran' => substr($request->input('buka_pendaftaran'), 0, 10)]);
                }
                if (!$request->filled('deadline_pendaftaran')) {
                    foreach ($validItems as $item) {
                        $judul = mb_strtolower($item['judul'] ?? '');
                        if (str_contains($judul, 'batas') || str_contains($judul, 'deadline') || str_contains($judul, 'tutup') || str_contains($judul, 'selesai pendaftaran')) {
                            $request->merge(['deadline_pendaftaran' => substr($item['tanggal'], 0, 10)]);
                            break;
                        }
                    }
                } else {
                    $request->merge(['deadline_pendaftaran' => substr($request->input('deadline_pendaftaran'), 0, 10)]);
                }
                if (!$request->filled('tanggal_mulai')) {
                    $mulai = null;
                    foreach ($validItems as $item) {
                        $judul = mb_strtolower($item['judul'] ?? '');
                        if (str_contains($judul, 'pelaksanaan') || str_contains($judul, 'mulai') || str_contains($judul, 'hari h') || str_contains($judul, 'acara')) {
                            $mulai = substr($item['tanggal'], 0, 10);
                            break;
                        }
                    }
                    if (!$mulai) {
                        foreach ($validItems as $item) {
                            $judul = mb_strtolower($item['judul'] ?? '');
                            if (!str_contains($judul, 'buka') && !str_contains($judul, 'daftar') && !str_contains($judul, 'deadline') && !str_contains($judul, 'batas')) {
                                $mulai = substr($item['tanggal'], 0, 10);
                                break;
                            }
                        }
                    }
                    $request->merge(['tanggal_mulai' => $mulai ?: substr($validItems[0]['tanggal'], 0, 10)]);
                } else {
                    $request->merge(['tanggal_mulai' => substr($request->input('tanggal_mulai'), 0, 10)]);
                }
                if (!$request->filled('tanggal_selesai')) {
                    $selesai = null;
                    foreach ($validItems as $item) {
                        $judul = mb_strtolower($item['judul'] ?? '');
                        if ((str_contains($judul, 'selesai') && !str_contains($judul, 'pendaftaran')) || str_contains($judul, 'penutupan') || str_contains($judul, 'awarding')) {
                            $selesai = substr($item['tanggal'], 0, 10);
                            break;
                        }
                    }
                    $lastItem = end($validItems);
                    $request->merge(['tanggal_selesai' => $selesai ?: substr($lastItem['tanggal'], 0, 10)]);
                } else {
                    $request->merge(['tanggal_selesai' => substr($request->input('tanggal_selesai'), 0, 10)]);
                }
            }
        }

        $rules = [
            'slug' => ['required', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'max:160', Rule::unique('events')->ignore($event?->id)],
            'judul' => ['required', 'string', 'max:200'], 'deskripsi' => ['nullable', 'string', 'max:20000'],
            'kategori' => ['required', 'string', 'max:60'],
            'poster' => ['nullable', 'string', 'max:2048'],
            'guidebook_type' => ['nullable', Rule::in(['file', 'link'])],
            'guidebook_value' => ['nullable', 'string', 'max:2048'],
            'tanggal_mulai' => ['required', 'date'], 'tanggal_selesai' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'buka_pendaftaran' => ['nullable', 'date'], 'deadline_pendaftaran' => ['nullable', 'date'],
            'timeline' => ['nullable', 'array', 'max:50'],
            'timeline.*.judul' => ['required', 'string', 'max:150'],
            'timeline.*.tanggal' => ['required', 'string'],
            'lokasi' => ['nullable', 'string', 'max:200'], 'tipe' => ['required', Rule::in(['online', 'offline', 'hybrid'])],
            'status' => ['required', Rule::in(['draft', 'published', 'closed', 'selesai'])],
            'tipe_pendaftaran' => ['required', Rule::in(['individu', 'tim'])],
            'kode_prefix' => ['nullable', 'regex:/^[A-Z]{1,6}$/'], 'min_anggota' => ['nullable', 'integer', 'min:2', 'max:100'],
            'max_anggota' => ['nullable', 'integer', 'gte:min_anggota', 'max:100'],
            'hadiah' => ['array', 'max:20'], 'hadiah.*' => ['string', 'max:250'],
            'syarat' => ['array', 'max:30'], 'syarat.*' => ['string', 'max:250'],
            'form_fields' => ['array', 'max:40'],
            'form_fields.*.name' => ['required', 'regex:/^[a-z][a-z0-9_]{0,49}$/'],
            'form_fields.*.label' => ['required', 'string', 'max:200'],
            'form_fields.*.type' => ['required', Rule::in(['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'radio', 'checkbox', 'file'])],
            'form_fields.*.required' => ['required', 'boolean'],
            'form_fields.*.options' => ['nullable', 'array', 'max:100'],
        ];
        if ($request->has('form_fields')) {
            throw ValidationException::withMessages(['form_fields' => ['Atur formulir melalui halaman detail event.']]);
        }
        $data = $request->validate($rules);
        EventGuidebookSource::validate($data);
        $names = array_column($data['form_fields'] ?? [], 'name');
        if (count($names) !== count(array_unique($names))) throw ValidationException::withMessages(['form_fields' => ['Nama kolom harus unik.']]);
        if ($data['tipe_pendaftaran'] === 'tim' && (empty($data['kode_prefix']) || empty($data['min_anggota']) || empty($data['max_anggota']))) {
            throw ValidationException::withMessages(['teamSettings' => ['Pengaturan tim belum lengkap.']]);
        }
        $details = [];
        if ($request->has('hadiah')) $details['hadiah'] = $data['hadiah'] ?? [];
        if ($request->has('syarat')) $details['syarat'] = $data['syarat'] ?? [];
        if ($request->has('form_fields')) $details['form_fields'] = $data['form_fields'] ?? [];
        unset($data['hadiah'], $data['syarat'], $data['form_fields']);
        return ['event' => $data, ...$details];
    }

    private function syncDetails(Event $event, array $data): void
    {
        if (isset($data['hadiah'])) {
            $event->prizes()->delete();
            foreach ($data['hadiah'] as $index => $label) $event->prizes()->create(['label' => $label, 'sort_order' => $index]);
        }
        if (isset($data['syarat'])) {
            $event->requirements()->delete();
            foreach ($data['syarat'] as $index => $label) $event->requirements()->create(['label' => $label, 'sort_order' => $index]);
        }
        if (isset($data['form_fields'])) {
            $event->formFields()->delete();
            foreach ($data['form_fields'] as $index => $field) $event->formFields()->create(array_merge($field, ['sort_order' => $index]));
        }
    }
}
