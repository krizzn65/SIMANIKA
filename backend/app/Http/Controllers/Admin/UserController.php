<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

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
                $pattern = '%'.mb_strtolower($escaped).'%';
                $q->whereRaw('LOWER(name) LIKE ?', [$pattern])
                  ->orWhereRaw('LOWER(email) LIKE ?', [$pattern]);
            });
        }

        // Filter by role
        if ($role = $request->query('role')) {
            if (in_array($role, User::ASSIGNABLE_ROLES, true) || $role === User::ROLE_SUPER_ADMIN) {
                $query->where('role', $role);
            }
        }

        // Sorting
        $allowedSorts = ['name', 'email', 'created_at', 'role'];
        $sortBy = in_array($request->query('sort_by'), $allowedSorts) ? $request->query('sort_by') : 'created_at';
        $sortDir = strtolower($request->query('sort_dir')) === 'asc' ? 'asc' : 'desc';

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $paginated = $query->orderByRaw('CASE WHEN role = ? AND lower(email) = ? THEN 0 ELSE 1 END', [User::ROLE_SUPER_ADMIN, strtolower((string) config('admin.email'))])->orderBy($sortBy, $sortDir)->orderBy('id')->paginate($perPage);

        // Stats summary for admin dashboard overview
        $stats = [
            'totalUsers' => User::count(),
            'totalSuperAdmins' => User::where('role', User::ROLE_SUPER_ADMIN)->count(),
            'totalAdmins' => User::where('role', User::ROLE_ADMIN)->count(),
            'totalLeaders' => User::where('role', User::ROLE_LEADER)->count(),
            'totalKwu' => User::where('role', User::ROLE_KWU)->count(),
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
                'role' => $u->effectiveRole(),
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
            'oprecRegistrations.oprec:id,periode,headline,status',
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
                'role' => $user->effectiveRole(),
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
                    'division' => null,
                    'oprec' => $r->oprec ? [
                        'id' => $r->oprec->id,
                        'judul' => $r->oprec->headline,
                        'slug' => $r->oprec->periode,
                    ] : null,
                ]),
            ],
        ]);
    }

    /** Only the sole official super administrator may assign staff roles. */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', Rule::in(User::ASSIGNABLE_ROLES)],
            'nim' => ['prohibited'],
            'jurusan' => ['prohibited'],
            'angkatan' => ['prohibited'],
        ]);

        if ($user->isSuperAdmin() || $user->role === User::ROLE_SUPER_ADMIN) {
            return response()->json(['message' => 'Akun Super Admin tidak dapat diubah.'], 422);
        }
        if (strcasecmp($validated['email'], (string) config('admin.email')) === 0) {
            return response()->json(['message' => 'Email resmi HIMANIKA khusus untuk Super Admin.'], 422);
        }

        DB::transaction(function () use ($user, $validated) {
            $locked = User::query()->lockForUpdate()->findOrFail($user->id);
            if ($locked->role === User::ROLE_SUPER_ADMIN) {
                abort(422, 'Akun Super Admin tidak dapat diubah.');
            }
            $locked->name = $validated['name'];
            $locked->email = $validated['email'];
            $locked->role = $validated['role'];
            $locked->save();
            $user->refresh();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->effectiveRole(),
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

        if ($targetUser->role === User::ROLE_SUPER_ADMIN || $targetUser->isSuperAdmin()) {
            return response()->json(['message' => 'Akun Super Admin tidak dapat dihapus.'], 422);
        }

        $userName = $targetUser->name;
        $targetUser->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Pengguna {$userName} berhasil dihapus dari sistem.",
        ]);
    }
}
