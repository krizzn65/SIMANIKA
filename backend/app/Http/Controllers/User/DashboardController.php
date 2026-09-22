<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\EventRegistration;
use App\Models\OprecRegistration;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();

        $events = EventRegistration::query()
            ->where('user_id', $userId)
            ->with('event:id,slug,judul,kategori,tanggal_mulai,poster')
            ->latest()
            ->get()
            ->filter(fn ($registration) => $registration->event !== null)
            ->map(fn ($registration) => [
                'key' => 'event-'.$registration->id,
                'kind' => 'event',
                'title' => $registration->event->judul,
                'subtitle' => $registration->event->kategori,
                'status' => $registration->status,
                'href' => '/events/'.$registration->event->slug,
                'date' => $registration->event->tanggal_mulai?->toIso8601String(),
                'registeredAt' => $registration->created_at?->toIso8601String(),
            ]);

        $teams = Team::query()
            ->where(function ($query) use ($userId) {
                $query->where('ketua_id', $userId)
                    ->orWhereHas('members', fn ($members) => $members->whereKey($userId));
            })
            ->with('event:id,slug,judul,kategori,tanggal_mulai')
            ->latest()
            ->get()
            ->filter(fn ($team) => $team->event !== null)
            ->map(fn ($team) => [
                'key' => 'team-'.$team->id,
                'kind' => 'team',
                'title' => $team->event->judul,
                'subtitle' => $team->nama_tim,
                'status' => $team->review_status,
                'href' => '/events/'.$team->event->slug,
                'date' => $team->event->tanggal_mulai?->toIso8601String(),
                'registeredAt' => $team->created_at?->toIso8601String(),
            ]);

        $oprecs = OprecRegistration::query()
            ->where('user_id', $userId)
            ->with('oprec:id,periode,headline,pengumuman_published,pengumuman_tanggal')
            ->latest()
            ->get()
            ->filter(fn ($registration) => $registration->oprec !== null)
            ->map(function ($registration) {
                $oprec = $registration->oprec;
                $announced = $oprec->pengumuman_published
                    && (!$oprec->pengumuman_tanggal || $oprec->pengumuman_tanggal->isPast());

                return [
                    'key' => 'oprec-'.$registration->id,
                    'kind' => 'oprec',
                    'title' => $oprec->headline ?: 'Open Recruitment HIMANIKA',
                    'subtitle' => 'Periode '.$oprec->periode,
                    'status' => $announced ? $registration->status : 'pending',
                    'href' => '/oprec/detail',
                    'date' => $announced ? $oprec->pengumuman_tanggal?->toIso8601String() : null,
                    'registeredAt' => $registration->created_at?->toIso8601String(),
                ];
            });

        $items = $events->concat($teams)->concat($oprecs)
            ->sortByDesc('registeredAt')
            ->values();

        return response()->json(['data' => ['items' => $items]]);
    }
}
