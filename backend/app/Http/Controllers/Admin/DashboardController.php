<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalUsers = User::count();
        $totalEvents = Event::count();
        $activeEvents = Event::whereIn('status', ['published'])->count();
        $totalRegistrations = EventRegistration::count();
        $totalTeams = Team::count();
        $totalOprecRegistrations = OprecRegistration::count();

        $activeOprec = Oprec::withCount('registrations')->latest()->first();

        $recentRegistrations = EventRegistration::with(['event:id,judul', 'user:id,name,email'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'eventTitle' => $r->event?->judul ?? '-',
                'userName' => $r->user?->name ?? $r->user?->email ?? '-',
                'status' => $r->status,
                'createdAt' => $r->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'stats' => [
                'totalUsers' => $totalUsers,
                'totalEvents' => $totalEvents,
                'activeEvents' => $activeEvents,
                'totalRegistrations' => $totalRegistrations,
                'totalTeams' => $totalTeams,
                'totalOprecRegistrations' => $totalOprecRegistrations,
            ],
            'activeOprec' => $activeOprec ? [
                'id' => $activeOprec->id,
                'judul' => $activeOprec->judul,
                'status' => $activeOprec->status,
                'totalPendaftar' => $activeOprec->registrations_count,
                'pengumumanPublished' => (bool) $activeOprec->pengumuman_published,
            ] : null,
            'recentRegistrations' => $recentRegistrations,
            'trends' => $this->dailyTrends(90),
        ]);
    }

    /** Daily sign-ups for the dashboard chart, bucketed by WIB date, zero-filled. */
    private function dailyTrends(int $days): array
    {
        $tz = 'Asia/Jakarta';
        $start = now($tz)->startOfDay()->subDays($days - 1);
        $series = ['users' => User::query(), 'events' => EventRegistration::query(), 'oprec' => OprecRegistration::query()];
        $counts = [];
        foreach ($series as $key => $query) {
            $query->where('created_at', '>=', $start->copy()->utc())->pluck('created_at')
                ->each(function ($at) use (&$counts, $key, $tz) {
                    $day = $at->copy()->setTimezone($tz)->toDateString();
                    $counts[$day][$key] = ($counts[$day][$key] ?? 0) + 1;
                });
        }
        $rows = [];
        for ($day = $start->copy(); $day->lte(now($tz)); $day->addDay()) {
            $date = $day->toDateString();
            $rows[] = ['date' => $date, 'users' => $counts[$date]['users'] ?? 0, 'events' => $counts[$date]['events'] ?? 0, 'oprec' => $counts[$date]['oprec'] ?? 0];
        }
        return $rows;
    }
}
