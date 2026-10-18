<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): UserResource { return new UserResource($request->user()); }

    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $previousEmail = $user->email;
        $user->update($request->validated());
        if (mb_strtolower(trim($previousEmail)) !== mb_strtolower(trim($user->email))) {
            $user->forceFill(['email_verified_at' => null])->save();
            $user->sendEmailVerificationNotification();
        }
        return new UserResource($request->user()->refresh());
    }
}
