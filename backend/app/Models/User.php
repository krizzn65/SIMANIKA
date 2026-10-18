<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_LEADER = 'leader';
    public const ROLE_KWU = 'kwu';
    public const ROLE_USER = 'user';

    public const ASSIGNABLE_ROLES = [self::ROLE_ADMIN, self::ROLE_LEADER, self::ROLE_KWU, self::ROLE_USER];

    use HasApiTokens, Notifiable;

    protected $fillable = ['nama', 'name', 'email', 'password', 'foto_profil', 'google_id'];
    protected $attributes = ['role' => 'user'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed'];
    }

    public function setNamaAttribute(?string $value): void
    {
        $this->attributes['name'] = $value;
    }

    public function getNamaAttribute(): string
    {
        if (!empty($this->attributes['name'])) {
            return $this->attributes['name'];
        }
        if (!empty($this->attributes['email'])) {
            return explode('@', $this->attributes['email'])[0];
        }
        return 'Pengguna';
    }

    public function getNameAttribute(?string $value): string
    {
        if (!empty($value)) {
            return $value;
        }
        if (!empty($this->attributes['email'])) {
            return explode('@', $this->attributes['email'])[0];
        }
        return 'Pengguna';
    }

    public static function configuredAdminEmail(): ?string
    {
        $email = config('admin.email');
        return is_string($email) && trim($email) !== '' ? mb_strtolower(trim($email)) : null;
    }

    public function isSuperAdmin(): bool
    {
        $configuredEmail = self::configuredAdminEmail();
        return $configuredEmail !== null
            && $this->role === self::ROLE_SUPER_ADMIN
            && mb_strtolower(trim((string) $this->email)) === $configuredEmail;
    }

    public function effectiveRole(): string
    {
        if ($this->isSuperAdmin()) return self::ROLE_SUPER_ADMIN;
        return in_array($this->role, self::ASSIGNABLE_ROLES, true) ? $this->role : self::ROLE_USER;
    }

    public function canAccessArea(string $area): bool
    {
        $role = $this->effectiveRole();
        if ($role === self::ROLE_SUPER_ADMIN) return in_array($area, ['console', 'dashboard', 'users', 'events', 'oprec', 'merchandise', 'settings', 'content', 'logs'], true);
        return match ($area) {
            'console' => in_array($role, [self::ROLE_ADMIN, self::ROLE_LEADER, self::ROLE_KWU], true),
            'dashboard', 'events', 'merchandise', 'settings', 'content' => $role === self::ROLE_ADMIN || ($area === 'merchandise' && $role === self::ROLE_KWU),
            'oprec' => in_array($role, [self::ROLE_ADMIN, self::ROLE_LEADER], true),
            default => false,
        };
    }

    public function eventRegistrations(): HasMany { return $this->hasMany(EventRegistration::class); }
    public function oprecRegistrations(): HasMany { return $this->hasMany(OprecRegistration::class); }
}
