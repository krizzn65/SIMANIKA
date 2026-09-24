<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

class EventGuidebookSource
{
    public static function validate(array &$data): void
    {
        if (!array_key_exists('guidebook_type', $data) && !array_key_exists('guidebook_value', $data)) return;

        $type = $data['guidebook_type'] ?? null;
        $value = $data['guidebook_value'] ?? null;
        if ($type === null && $value === null) return;

        if ($type === 'file' && is_string($value) &&
            preg_match('/^events\/guidebooks\/[A-Za-z0-9_-]+\.pdf$/', $value)) return;

        if ($type === 'link' && is_string($value) && filter_var($value, FILTER_VALIDATE_URL) &&
            parse_url($value, PHP_URL_SCHEME) === 'https' &&
            !parse_url($value, PHP_URL_USER) && !parse_url($value, PHP_URL_PASS)) return;

        throw ValidationException::withMessages([
            'guidebook_value' => ['Pilih PDF yang diunggah atau masukkan tautan HTTPS yang valid.'],
        ]);
    }

    public static function url(?string $type, ?string $value): ?string
    {
        if ($type === 'link' && is_string($value) && filter_var($value, FILTER_VALIDATE_URL) &&
            parse_url($value, PHP_URL_SCHEME) === 'https' && !parse_url($value, PHP_URL_USER) &&
            !parse_url($value, PHP_URL_PASS)) return $value;

        if ($type === 'file' && is_string($value) &&
            preg_match('/^events\/guidebooks\/([A-Za-z0-9_-]+\.pdf)$/', $value, $match)) {
            return route('public.event-guidebook', ['filename' => $match[1]]);
        }

        return null;
    }
}
