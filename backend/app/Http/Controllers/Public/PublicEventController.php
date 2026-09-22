<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicEventController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'kategori' => ['sometimes', Rule::in(['lomba', 'seminar', 'workshop', 'lainnya'])],
            'status' => ['sometimes', Rule::in(['upcoming', 'ongoing', 'selesai'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:9'],
        ]);
        $now = now();
        $query = Event::query()->whereIn('status', ['published', 'closed', 'selesai'])
            ->withCount(['registrations' => fn ($q) => $q->whereIn('status', ['pending', 'accepted']), 'teams' => fn ($q) => $q->where('review_status', '!=', 'rejected')]);
        if (!empty($filters['search'])) $query->whereRaw('LOWER(judul) LIKE ?', ['%'.mb_strtolower(str_replace(['%', '_'], ['\\%', '\\_'], $filters['search'])).'%']);
        if (!empty($filters['kategori'])) $query->where('kategori', $filters['kategori']);
        if (($filters['status'] ?? null) === 'upcoming') $query->where('status', '!=', 'selesai')->where('tanggal_mulai', '>', $now);
        if (($filters['status'] ?? null) === 'ongoing') $query->where('status', '!=', 'selesai')->where('tanggal_mulai', '<=', $now)->where('tanggal_selesai', '>', $now);
        if (($filters['status'] ?? null) === 'selesai') $query->where(fn ($q) => $q->where('status', 'selesai')->orWhere('tanggal_selesai', '<=', $now));
        $query->orderByRaw('CASE WHEN status = ? OR tanggal_selesai <= ? THEN 2 WHEN tanggal_mulai <= ? THEN 1 ELSE 0 END ASC', ['selesai', $now, $now])
            ->orderBy('tanggal_mulai');
        $page = $query->paginate($filters['per_page'] ?? 9);
        return response()->json([
            'data' => EventResource::collection($page->items())->resolve(),
            'meta' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(), 'total' => $page->total()],
        ]);
    }

    public function show(string $slug)
    {
        $event = Event::query()->where('slug', $slug)->whereIn('status', ['published', 'closed', 'selesai'])
            ->with(['requirements', 'prizes', 'formFields'])->withCount(['registrations' => fn ($q) => $q->whereIn('status', ['pending', 'accepted']), 'teams' => fn ($q) => $q->where('review_status', '!=', 'rejected')])->firstOrFail();
        return new EventResource($event);
    }
}
