<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'nim', 'jurusan', 'angkatan', 'foto_profil', 'role'];
    protected $attributes = ['role' => 'user'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'angkatan' => 'integer'];
    }

    public function eventRegistrations(): HasMany { return $this->hasMany(EventRegistration::class); }
    public function oprecRegistrations(): HasMany { return $this->hasMany(OprecRegistration::class); }
}
