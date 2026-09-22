<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class PasswordController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:254']]);
        Password::sendResetLink($data);
        return response()->json(['message' => 'Jika email terdaftar, tautan reset akan dikirim.']);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string'], 'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);
        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
        });
        if ($status !== Password::PASSWORD_RESET) return response()->json(['message' => 'Tautan reset tidak valid atau sudah kedaluwarsa.'], 422);
        return response()->json(['message' => 'Kata sandi berhasil diperbarui.']);
    }

    public function change(Request $request)
    {
        $data = $request->validate(['current_password' => ['required', 'current_password'], 'password' => ['required', 'confirmed', PasswordRule::min(8)]]);
        $request->user()->update(['password' => $data['password']]);
        return response()->json(['message' => 'Kata sandi berhasil diperbarui.']);
    }
}
