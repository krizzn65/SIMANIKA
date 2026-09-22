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
        $user = User::create($request->safe()->only(['email', 'password']));
        Auth::login($user);
        $request->session()->regenerate();
        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
