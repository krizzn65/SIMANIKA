<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Oprec extends Model
{
    protected $fillable = ['periode', 'status', 'headline', 'deskripsi', 'poster', 'poster_alt', 'tanggal_buka', 'tanggal_tutup', 'schema_version', 'form_intro', 'link_grup_wa', 'form_fields', 'faq', 'pengumuman_published', 'pengumuman_tanggal', 'pengumuman_pesan'];
    protected function casts(): array { return ['tanggal_buka' => 'datetime', 'tanggal_tutup' => 'datetime', 'pengumuman_tanggal' => 'datetime', 'pengumuman_published' => 'boolean', 'form_fields' => 'array', 'faq' => 'array']; }
    public function divisions(): HasMany { return $this->hasMany(OprecDivision::class)->orderBy('sort_order'); }
    public function stages(): HasMany { return $this->hasMany(OprecStage::class)->orderBy('tanggal_buka'); }
    public function registrations(): HasMany { return $this->hasMany(OprecRegistration::class); }
}
