<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request)
    {
        $payload = $request->safe()->only(['email', 'password']);
        $nama = $request->validated('nama') ?? $request->validated('name');
        if ($nama) {
            $payload['nama'] = $nama;
            $payload['name'] = $nama;
        }

        $user = User::create($payload);
        Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }
        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
