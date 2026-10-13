<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class OprecDivision extends Model
{
    public $timestamps = false;
    protected $fillable = ['oprec_id', 'nama', 'nama_lengkap', 'deskripsi', 'logo', 'jabatan', 'sort_order'];
    protected function casts(): array { return ['jabatan' => 'array']; }

    public function getJabatanAttribute(): array
    {
        return self::defaultJabatan($this->nama ?? '');
    }

    public function registrationPosition(?string $value, int $rank): string
    {
        $positions = $this->jabatan;
        $position = trim($value ?? '');
        if ($position === '' && count($positions) === 1) return $positions[0];
        if (!in_array($position, $positions, true)) {
            throw ValidationException::withMessages(["jabatan_pilihan_{$rank}" => ['Pilih jabatan pendaftaran yang tersedia pada divisi ini.']]);
        }
        return $position;
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
