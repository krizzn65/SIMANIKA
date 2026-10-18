<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditTrail;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function store(LoginRequest $request): JsonResponse
    {
        if (!Auth::guard('web')->attempt($request->safe()->only(['email', 'password']), $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => ['Email atau kata sandi tidak sesuai.']]);
        }
        $googleLinkedNow = false;
        if ($request->hasSession()) {
            $pending = $request->session()->pull('pending_google_link');
            $googleId = is_array($pending) ? ($pending['google_id'] ?? null) : null;
            $pendingEmail = is_array($pending) ? ($pending['email'] ?? null) : null;
            if (is_string($googleId) && $googleId !== '' && is_string($pendingEmail)
                && ($pending['expires_at'] ?? 0) >= now()->timestamp
                && hash_equals($pendingEmail, mb_strtolower($request->user()->email))) {
                try {
                    $googleLinkedNow = DB::transaction(function () use ($request, $googleId): bool {
                        $user = User::whereKey($request->user()->getKey())->lockForUpdate()->firstOrFail();
                        if ($user->google_id !== null && $user->google_id !== $googleId) return false;
                        if (User::where('google_id', $googleId)->where('id', '!=', $user->id)->exists()) return false;
                        $user->google_id = $googleId;
                        $user->save();
                        return true;
                    });
                } catch (QueryException $e) {
                    report($e);
                }
            }
            $request->session()->regenerate();
        }
        if ($googleLinkedNow) {
            app(AuditTrail::class)->recordCustom(
                request: $request,
                module: 'auth',
                action: 'auth.google_link',
                kind: 'security',
                result: 'success',
                summary: 'Akun Google terhubung ke akun manual',
                httpStatus: 200,
                actor: $request->user(),
                context: ['auth_method' => 'manual', 'account_linked' => true]
            );
        }
        return (new UserResource($request->user()->refresh()))
            ->additional(['googleLinkedNow' => $googleLinkedNow])
            ->response()->setStatusCode(200);
    }

    public function destroy(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $accessToken = $user?->currentAccessToken();
            if ($accessToken && method_exists($accessToken, 'delete')) {
                $accessToken->delete();
            }

            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json(['message' => 'Berhasil keluar.']);
        } catch (\Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Terjadi kendala saat keluar dari sesi akun. Silakan coba lagi.'
            ], 500);
        }
    }
}
