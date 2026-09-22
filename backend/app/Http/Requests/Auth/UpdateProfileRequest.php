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
            'nim' => ['sometimes', 'nullable', 'string', 'max:32', Rule::unique('users')->ignore($this->user()->id)],
            'jurusan' => ['sometimes', 'nullable', 'string', 'max:150'],
            'angkatan' => ['sometimes', 'nullable', 'integer', 'between:2000,2100'],
        ];
    }
}
