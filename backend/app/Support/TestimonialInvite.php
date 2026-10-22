<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// The single active testimonial link. Creating a new one retires the old one.
class TestimonialInvite
{
    public static function active(): ?object
    {
        return DB::table('testimonial_invites')->whereNull('revoked_at')->latest('id')->first();
    }

    public static function usable(?object $invite): bool
    {
        return $invite && !$invite->revoked_at && (!$invite->expires_at || now()->lt($invite->expires_at));
    }

    public static function create(?int $quota, ?string $expiresAt): object
    {
        return DB::transaction(function () use ($quota, $expiresAt) {
            DB::table('testimonial_invites')->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
            $id = DB::table('testimonial_invites')->insertGetId([
                'token' => Str::random(40),
                'quota' => $quota,
                'expires_at' => $expiresAt,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return DB::table('testimonial_invites')->find($id);
        });
    }

    public static function revoke(): void
    {
        DB::table('testimonial_invites')->whereNull('revoked_at')->update(['revoked_at' => now(), 'updated_at' => now()]);
    }

    public static function membership(object $invite, int $userId): ?object
    {
        return DB::table('testimonial_invite_users')->where('testimonial_invite_id', $invite->id)->where('user_id', $userId)->first();
    }

    public static function joinedCount(object $invite): int
    {
        return DB::table('testimonial_invite_users')->where('testimonial_invite_id', $invite->id)->count();
    }

    public static function contentId(): int
    {
        return DB::table('site_contents')->orderBy('id')->value('id')
            ?? DB::table('site_contents')->insertGetId(['created_at' => now(), 'updated_at' => now()]);
    }
}
