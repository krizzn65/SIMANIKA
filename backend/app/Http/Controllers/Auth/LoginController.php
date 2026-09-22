<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    public function store(LoginRequest $request): UserResource
    {
        if (!Auth::guard('web')->attempt($request->safe()->only(['email', 'password']), $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => ['Email atau kata sandi tidak sesuai.']]);
        }
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
        return new UserResource($request->user());
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
