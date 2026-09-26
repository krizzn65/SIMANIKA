<?php

namespace App\Http\Requests\Oprec;

use Illuminate\Foundation\Http\FormRequest;

class ScoreTestSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isOfficialAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'score' => ['required', 'numeric', 'between:0,100', 'regex:/^\d{1,3}(?:\.\d{1,2})?$/'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
