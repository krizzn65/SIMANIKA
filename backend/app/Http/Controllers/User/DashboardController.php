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

        $activeEvent = fn ($query) => $query->where("status", "!=", "selesai")->whereDate("tanggal_selesai", ">=", today());

        $events = EventRegistration::query()
            ->where('user_id', $userId)
            ->whereHas("event", $activeEvent)
            ->with('event:id,slug,judul,kategori,tanggal_mulai,poster,payment_type,htm')
            ->latest()
            ->get()
            ->filter(fn ($registration) => $registration->event !== null)
            ->map(fn ($registration) => [
                'key' => 'event-'.$registration->id,
                'kind' => 'event',
                'title' => $registration->event->judul,
                'subtitle' => $registration->event->kategori,
                'category' => $registration->event->kategori,
                'paymentType' => $registration->event->payment_type ?? 'free',
                'htm' => $registration->event->payment_type === 'paid' ? $registration->event->htm : null,
                'status' => $registration->status,
                'href' => '/dashboard/events/'.$registration->event->id,
                'date' => $registration->event->tanggal_mulai?->toIso8601String(),
                'registeredAt' => $registration->created_at?->toIso8601String(),
                'eventId' => $registration->event->id,
            ]);

        $teams = Team::query()
            ->where(function ($query) use ($userId) {
                $query->where('ketua_id', $userId)
                    ->orWhereHas('participants', fn ($members) => $members->whereKey($userId));
            })
            ->whereHas("event", $activeEvent)
            ->with('event:id,slug,judul,kategori,tanggal_mulai,payment_type,htm,min_anggota,max_anggota')
            ->with(['participants' => fn ($query) => $query->whereKey($userId)])
            ->withCount('members')
            ->latest()
            ->get()
            ->filter(fn ($team) => $team->event !== null)
            ->map(fn ($team) => [
                'key' => 'team-'.$team->id,
                'kind' => 'team',
                'title' => $team->event->judul,
                'subtitle' => $team->nama_tim.' · Kode: '.$team->kode_unik,
                'category' => $team->event->kategori,
                'teamName' => $team->nama_tim,
                'teamCode' => $team->kode_unik,
                'teamMembers' => (int) $team->members_count,
                'teamMin' => $team->event->min_anggota,
                'teamMax' => $team->event->max_anggota,
                'paymentType' => $team->event->payment_type ?? 'free',
                'htm' => $team->event->payment_type === 'paid' ? $team->event->htm : null,
                'status' => $team->participants->first()?->pivot->status === 'pending' ? 'join_pending' : $team->review_status,
                'href' => '/dashboard/events/'.$team->event->id,
                'date' => $team->event->tanggal_mulai?->toIso8601String(),
                'registeredAt' => $team->created_at?->toIso8601String(),
                'eventId' => $team->event->id,
            ]);

        $completedIds = $events->pluck("eventId")->concat($teams->pluck("eventId"))->all();
        $enrollments = EventEnrollmentDashboard::items($userId, $completedIds);
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

        $items = $events->concat($teams)->concat($enrollments)->concat($oprecs)
            ->sortByDesc('registeredAt')
            ->values();

        return response()->json(['data' => ['items' => $items]]);
    }
}
