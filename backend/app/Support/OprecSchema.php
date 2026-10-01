<?php

namespace App\Support;

/** PostgreSQL JSONB can reorder object keys; ordered schema lists remain significant. */
final class OprecSchema
{
    public static function same(array $left, array $right): bool
    {
        return self::normalize($left) === self::normalize($right);
    }

    private static function normalize(mixed $value): mixed
    {
        if (!is_array($value)) return $value;
        if (!array_is_list($value)) ksort($value, SORT_STRING);
        foreach ($value as $key => $item) $value[$key] = self::normalize($item);
        return $value;
    }
}
