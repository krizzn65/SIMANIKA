<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
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

    public function isOfficialAdmin(): bool
    {
        $configuredEmail = self::configuredAdminEmail();
        return $configuredEmail !== null && $this->role === 'admin' && mb_strtolower(trim((string) $this->email)) === $configuredEmail;
    }

    public function eventRegistrations(): HasMany { return $this->hasMany(EventRegistration::class); }
    public function oprecRegistrations(): HasMany { return $this->hasMany(OprecRegistration::class); }
}
