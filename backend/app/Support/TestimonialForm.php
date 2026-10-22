<?php

namespace App\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Whether users may submit a testimonial from their dashboard. Kept in a small
// file like the maintenance switch; each opening starts a new one-per-user round.
class TestimonialForm
{
    private const FILE = 'testimonial-form.json';

    public static function current(): array
    {
        $disk = Storage::disk('local');
        $stored = $disk->exists(self::FILE) ? json_decode((string) $disk->get(self::FILE), true) : null;
        return [
            'open' => (bool) ($stored['open'] ?? false),
            'opened_at' => isset($stored['opened_at']) ? Carbon::parse($stored['opened_at']) : null,
        ];
    }

    public static function set(bool $open): array
    {
        $current = self::current();
        $openedAt = $open ? ($current['open'] ? $current['opened_at'] : now()) : $current['opened_at'];
        Storage::disk('local')->put(self::FILE, json_encode(['open' => $open, 'opened_at' => $openedAt?->toIso8601String()]));
        return self::current();
    }

    public static function contentId(): int
    {
        return DB::table('site_contents')->orderBy('id')->value('id')
            ?? DB::table('site_contents')->insertGetId(['created_at' => now(), 'updated_at' => now()]);
    }
}
