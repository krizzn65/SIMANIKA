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
                  ->orWhere('email', 'ilike', "%{$escaped}%")
                  ->orWhere('nim', 'ilike', "%{$escaped}%");
            });
        }

        // Filter by role
        if ($role = $request->query('role')) {
            if (in_array($role, ['admin', 'user'])) {
                $query->where('role', $role);
            }
        }

        // Filter by angkatan
        if ($angkatan = $request->query('angkatan')) {
            $query->where('angkatan', (int) $angkatan);
        }

        // Sorting
        $allowedSorts = ['name', 'email', 'created_at', 'role', 'angkatan'];
        $sortBy = in_array($request->query('sort_by'), $allowedSorts) ? $request->query('sort_by') : 'created_at';
        $sortDir = strtolower($request->query('sort_dir')) === 'asc' ? 'asc' : 'desc';

        $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
        $paginated = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        // Stats summary for admin dashboard overview
        $stats = [
            'totalUsers' => User::count(),
            'totalAdmins' => User::where('role', 'admin')->count(),
            'totalRegular' => User::where('role', 'user')->count(),
            'totalMif' => User::where(function ($q) {
                $q->where('jurusan', 'ilike', '%informatika%')
                  ->orWhere('jurusan', 'ilike', '%mif%');
            })->count(),
            'newThisWeek' => User::where('created_at', '>=', Carbon::now()->subDays(7))->count(),
        ];

        $users = collect($paginated->items())->map(function ($u) {
            $displayName = !empty($u->nama) ? $u->nama : (!empty($u->name) ? $u->name : explode('@', $u->email)[0]);
            return [
                'id' => $u->id,
                'name' => $displayName,
                'nama' => $displayName,
                'email' => $u->email,
                'nim' => $u->nim,
                'jurusan' => $u->jurusan,
                'angkatan' => $u->angkatan,
                'role' => $u->role,
                'fotoProfil' => $u->foto_profil,
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
                'nim' => $user->nim,
                'jurusan' => $user->jurusan,
                'angkatan' => $user->angkatan,
                'role' => $user->role,
                'fotoProfil' => $user->foto_profil,
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

    /**
     * Update user role (admin <-> user).
     */
    public function updateRole(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['admin', 'user'])],
        ]);

        $user = User::findOrFail($id);

        // Safeguard: Ensure system has at least 1 admin
        if ($user->role === 'admin' && $validated['role'] === 'user') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Tidak dapat mengubah role admin terakhir demi keamanan sistem.',
                ], 422);
            }
        }

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => "Role pengguna {$user->name} berhasil diubah menjadi {$user->role}.",
            'data' => [
                'id' => $user->id,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Update user details (name, nim, jurusan, angkatan, role).
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'nim' => ['nullable', 'string', 'max:30'],
            'jurusan' => ['nullable', 'string', 'max:100'],
            'angkatan' => ['nullable', 'integer', 'min:2000', 'max:2099'],
            'role' => ['nullable', 'string', Rule::in(['admin', 'user'])],
        ]);

        if (isset($validated['role']) && $user->role === 'admin' && $validated['role'] === 'user') {
            $adminCount = User::where('role', 'admin')->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Tidak dapat mengubah role admin terakhir demi keamanan sistem.',
                ], 422);
            }
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->nim = $validated['nim'] ?? $user->nim;
        $user->jurusan = $validated['jurusan'] ?? $user->jurusan;
        $user->angkatan = $validated['angkatan'] ?? $user->angkatan;

        if (isset($validated['role'])) {
            $user->role = $validated['role'];
        }

        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nim' => $user->nim,
                'jurusan' => $user->jurusan,
                'angkatan' => $user->angkatan,
                'role' => $user->role,
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
