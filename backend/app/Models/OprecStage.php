<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OprecStage extends Model
{
    protected $fillable = [
        'oprec_id', 'type', 'headline', 'deskripsi', 'poster',
        'tanggal_buka', 'tanggal_tutup', 'published', 'form_fields',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_buka' => 'datetime',
            'tanggal_tutup' => 'datetime',
            'published' => 'boolean',
            'form_fields' => 'array',
        ];
    }

    public function oprec(): BelongsTo { return $this->belongsTo(Oprec::class); }
    public function submissions(): HasMany { return $this->hasMany(OprecTestSubmission::class, 'oprec_stage_id'); }
}
