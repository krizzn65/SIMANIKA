<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OprecDivision extends Model
{
    public $timestamps = false;
    protected $fillable = ['oprec_id', 'nama', 'nama_lengkap', 'deskripsi', 'logo', 'jabatan', 'sort_order'];
    protected function casts(): array { return ['jabatan' => 'array']; }

    public function getJabatanAttribute($value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (is_array($decoded) && count($decoded) > 0) {
            return array_values(array_filter(array_map('trim', $decoded)));
        }
        return self::defaultJabatan($this->nama ?? '');
    }

    public static function defaultJabatan(?string $nama): array
    {
        $clean = trim($nama ?? '');
        if ($clean === '') {
            return [];
        }
        if (strcasecmp($clean, 'bph') === 0) {
            return ['Wakil Ketua Umum', 'Sekretaris 2', 'Bendahara 2'];
        }
        return ['Staff Divisi ' . $clean];
    }

    public function oprec() { return $this->belongsTo(Oprec::class); }
}
