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

        $recentEvents = Event::withCount(['registrations', 'teams'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'slug' => $e->slug,
                'judul' => $e->judul,
                'kategori' => $e->kategori,
                'status' => $e->status,
                'tipePendaftaran' => $e->tipe_pendaftaran,
                'totalPendaftar' => $e->tipe_pendaftaran === 'tim'
                    ? $e->teams_count
                    : $e->registrations_count,
                'totalTim' => $e->teams_count,
                'tanggalMulai' => $e->tanggal_mulai ? (is_string($e->tanggal_mulai) ? $e->tanggal_mulai : $e->tanggal_mulai->format('Y-m-d')) : null,
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
            'recentEvents' => $recentEvents,
        ]);
    }
}
