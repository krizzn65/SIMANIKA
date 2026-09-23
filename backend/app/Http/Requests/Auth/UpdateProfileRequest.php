<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nama' => ['sometimes', 'nullable', 'string', 'max:150'],
            'name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'email' => ['sometimes', 'required', 'email', 'max:254', Rule::unique('users')->ignore($this->user()->id)],
            'nim' => ['prohibited'],
            'jurusan' => ['prohibited'],
            'angkatan' => ['prohibited'],
            'foto_profil' => ['prohibited'],
        ];
    }
}
