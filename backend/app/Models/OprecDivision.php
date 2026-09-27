<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OprecDivision extends Model
{
    public $timestamps = false;
    protected $fillable = ['oprec_id', 'nama', 'nama_lengkap', 'deskripsi', 'logo', 'jabatan', 'sort_order'];
    protected function casts(): array { return ['jabatan' => 'array']; }
    public function oprec() { return $this->belongsTo(Oprec::class); }
}
