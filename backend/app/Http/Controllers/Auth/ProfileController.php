<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): UserResource { return new UserResource($request->user()); }

    public function update(Request $request): UserResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'nim' => ['sometimes', 'nullable', 'string', 'max:32', Rule::unique('users')->ignore($request->user()->id)],
            'jurusan' => ['sometimes', 'nullable', 'string', 'max:150'],
            'angkatan' => ['sometimes', 'nullable', 'integer', 'between:2000,2100'],
        ]);
        $request->user()->update($data);
        return new UserResource($request->user()->refresh());
    }
}
