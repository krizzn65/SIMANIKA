<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'nama' => ['sometimes', 'nullable', 'string', 'max:150'],
            'name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
        ];
    }
}
