<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get paginated list of users with search, filtering, and summary statistics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->withCount(['eventRegistrations', 'oprecRegistrations']);

        // Search by name, email, or NIM
        $search = trim((string) ($request->query('q') ?? $request->query('search') ?? ''));
        if ($search !== '') {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $query->where(function ($q) use ($escaped) {
                $q->where('name', 'ilike', "%{$escaped}%")
                  ->orWhere('email', 'ilike', "%{$escaped}%");
            });
        }

        // Filter by role
        if ($role = $request->query('role')) {
            if (in_array($role, ['admin', 'user'])) {
                $query->where('role', $role);
            }
        }

        // Sorting
        $allowedSorts = ['name', 'email', 'created_at', 'role'];
        $sortBy = in_array($request->query('sort_by'), $allowedSorts) ? $request->query('sort_by') : 'created_at';
        $sortDir = strtolower($request->query('sort_dir')) === 'asc' ? 'asc' : 'desc';

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $paginated = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        // Stats summary for admin dashboard overview
        $stats = [
            'totalUsers' => User::count(),
            'totalAdmins' => User::where('role', 'admin')->count(),
            'totalRegular' => User::where('role', 'user')->count(),
            'newThisWeek' => User::where('created_at', '>=', Carbon::now()->subDays(7))->count(),
        ];

        $users = collect($paginated->items())->map(function ($u) {
            $displayName = !empty($u->nama) ? $u->nama : (!empty($u->name) ? $u->name : explode('@', $u->email)[0]);
            return [
                'id' => $u->id,
                'name' => $displayName,
                'nama' => $displayName,
                'email' => $u->email,
                'fotoProfil' => $u->foto_profil,
                'role' => $u->isOfficialAdmin() ? 'admin' : 'user',
                'emailVerifiedAt' => $u->email_verified_at?->toIso8601String(),
                'createdAt' => $u->created_at?->toIso8601String(),
                'eventRegistrationsCount' => $u->event_registrations_count ?? 0,
                'oprecRegistrationsCount' => $u->oprec_registrations_count ?? 0,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $users,
            'stats' => $stats,
            'meta' => [
                'currentPage' => $paginated->currentPage(),
                'lastPage' => $paginated->lastPage(),
                'perPage' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Get detailed user info including participation history.
     */
    public function show($id): JsonResponse
    {
        $user = User::with([
            'eventRegistrations.event:id,judul,slug,kategori,status',
            'oprecRegistrations.oprec:id,judul,slug,status',
            'oprecRegistrations.division:id,nama',
        ])
        ->withCount(['eventRegistrations', 'oprecRegistrations'])
        ->findOrFail($id);

        $displayName = !empty($user->nama) ? $user->nama : (!empty($user->name) ? $user->name : explode('@', $user->email)[0]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $displayName,
                'nama' => $displayName,
                'email' => $user->email,
                'fotoProfil' => $user->foto_profil,
                'role' => $user->isOfficialAdmin() ? 'admin' : 'user',
                'emailVerifiedAt' => $user->email_verified_at?->toIso8601String(),
                'createdAt' => $user->created_at?->toIso8601String(),
                'eventRegistrations' => $user->eventRegistrations->map(fn ($r) => [
                    'id' => $r->id,
                    'status' => $r->status,
                    'createdAt' => $r->created_at?->toIso8601String(),
                    'event' => $r->event ? [
                        'id' => $r->event->id,
                        'judul' => $r->event->judul,
                        'slug' => $r->event->slug,
                        'kategori' => $r->event->kategori,
                        'status' => $r->event->status,
                    ] : null,
                ]),
                'oprecRegistrations' => $user->oprecRegistrations->map(fn ($r) => [
                    'id' => $r->id,
                    'status' => $r->status,
                    'createdAt' => $r->created_at?->toIso8601String(),
                    'division' => $r->division?->nama ?? '-',
                    'oprec' => $r->oprec ? [
                        'id' => $r->oprec->id,
                        'judul' => $r->oprec->judul,
                        'slug' => $r->oprec->slug,
                    ] : null,
                ]),
            ],
        ]);
    }

    /** Update user details. Role is controlled by ADMIN_EMAIL. */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'nim' => ['prohibited'],
            'jurusan' => ['prohibited'],
            'angkatan' => ['prohibited'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->isOfficialAdmin() ? 'admin' : 'user',
            ],
        ]);
    }

    /**
     * Delete user with security checks.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $targetUser = User::findOrFail($id);

        // Cannot delete self
        if ($request->user() && $request->user()->id === (int) $id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        // Cannot delete sole admin
        if ($targetUser->role === 'admin') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Tidak dapat menghapus satu-satunya akun admin.',
                ], 422);
            }
        }

        $userName = $targetUser->name;
        $targetUser->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Pengguna {$userName} berhasil dihapus dari sistem.",
        ]);
    }
}
