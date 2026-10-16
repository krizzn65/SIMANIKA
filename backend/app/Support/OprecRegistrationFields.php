<?php

namespace App\Support;

final class OprecRegistrationFields
{
    public static function defaults(): array
    {
        return [[
            'name' => 'status_kepengurusan',
            'type' => 'select',
            'label' => 'Status Kepengurusan',
            'required' => true,
            'options' => [
                ['value' => 'Anggota Baru', 'label' => 'Anggota Baru'],
                ['value' => 'Melanjutkan Periode kedua', 'label' => 'Melanjutkan Periode kedua'],
            ],
        ]];
    }

    public static function withDefaults(array $fields): array
    {
        foreach (self::defaults() as $default) {
            $existingIndex = collect($fields)->search(fn ($field) => ($field['name'] ?? null) === $default['name']);
            if ($existingIndex !== false) {
                $existing = $fields[$existingIndex];
                $fields[$existingIndex] = array_merge($default, $existing);
                foreach (['name', 'type', 'required'] as $systemProperty) {
                    $fields[$existingIndex][$systemProperty] = $default[$systemProperty];
                }
                if (isset($existing['options']) && is_array($existing['options']) && count($existing['options']) >= 2) {
                    $fields[$existingIndex]['options'] = $existing['options'];
                }
            } else {
                $position = collect($fields)->search(fn ($field) => ($field['name'] ?? null) === 'divisi_pilihan_1');
                if ($position === false) $fields[] = $default;
                else array_splice($fields, $position, 0, [$default]);
            }
        }
        return $fields;
    }
}
