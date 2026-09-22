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
        $request->user()->update($request->validated());
        return new UserResource($request->user()->refresh());
    }
}
