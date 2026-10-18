<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

final class SearchSql
{
    public static function text(string $column): string
    {
        return DB::connection()->getQueryGrammar()->wrap($column);
    }

    public static function lowerLike(string $column): string
    {
        // MySQL uses backslash as LIKE's default escape; ESCAPE '\' is invalid
        // there under the default SQL mode. PostgreSQL and SQLite need the clause.
        return 'LOWER('.self::text($column).') LIKE ?'.(DB::getDriverName() === 'mysql' ? '' : " ESCAPE '\\'");
    }
}
