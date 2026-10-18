<?php

namespace App\Support;

use Illuminate\Database\Query\Expression;
use Illuminate\Support\Facades\DB;

final class JsonDefault
{
    public static function value(string $json): string|Expression
    {
        // MySQL 8.0.30 accepts JSON defaults only as expressions.
        return DB::getDriverName() === 'mysql' ? DB::raw('('.DB::getPdo()->quote($json).')') : $json;
    }
}
