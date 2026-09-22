<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = ['slug', 'judul', 'deskripsi', 'kategori', 'poster', 'tanggal_mulai', 'tanggal_selesai', 'buka_pendaftaran', 'deadline_pendaftaran', 'lokasi', 'tipe', 'kuota', 'status', 'tipe_pendaftaran', 'kode_prefix', 'min_anggota', 'max_anggota', 'kuota_tim', 'registration_url', 'created_by'];

    protected function casts(): array
    {
        return ['tanggal_mulai' => 'datetime', 'tanggal_selesai' => 'datetime', 'buka_pendaftaran' => 'datetime', 'deadline_pendaftaran' => 'datetime', 'kuota' => 'integer', 'kuota_tim' => 'integer'];
    }

    public function registrations(): HasMany { return $this->hasMany(EventRegistration::class); }
    public function teams(): HasMany { return $this->hasMany(Team::class); }
    public function prizes(): HasMany { return $this->hasMany(EventPrize::class)->orderBy('sort_order'); }
    public function requirements(): HasMany { return $this->hasMany(EventRequirement::class)->orderBy('sort_order'); }
    public function formFields(): HasMany { return $this->hasMany(EventFormField::class)->orderBy('sort_order'); }
}
