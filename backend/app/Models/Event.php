<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = ['slug', 'judul', 'deskripsi', 'kategori', 'poster', 'guidebook_type', 'guidebook_value', 'tanggal_mulai', 'tanggal_selesai', 'buka_pendaftaran', 'deadline_pendaftaran', 'lokasi', 'tipe', 'status', 'tipe_pendaftaran', 'kode_prefix', 'min_anggota', 'max_anggota', 'timeline', 'created_by'];

    protected function casts(): array
    {
        return ['tanggal_mulai' => 'date:Y-m-d', 'tanggal_selesai' => 'date:Y-m-d', 'buka_pendaftaran' => 'date:Y-m-d', 'deadline_pendaftaran' => 'date:Y-m-d', 'timeline' => 'array'];
    }

    public function registrations(): HasMany { return $this->hasMany(EventRegistration::class); }
    public function teams(): HasMany { return $this->hasMany(Team::class); }
    public function prizes(): HasMany { return $this->hasMany(EventPrize::class)->orderBy('sort_order'); }
    public function requirements(): HasMany { return $this->hasMany(EventRequirement::class)->orderBy('sort_order'); }
    public function formFields(): HasMany { return $this->hasMany(EventFormField::class)->orderBy('sort_order'); }
}
