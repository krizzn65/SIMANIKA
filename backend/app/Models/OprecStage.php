<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Carbon;

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
    protected function tanggalBuka(): Attribute
    {
        return $this->zonedSchedule();
    }
    protected function tanggalTutup(): Attribute
    {
        return $this->zonedSchedule();
    }
    private function zonedSchedule(): Attribute
    {
        $postgres = config('database.default') === 'pgsql';
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Carbon::parse($value, $postgres ? 'UTC' : config('app.timezone')),
            set: fn ($value) => $value === null ? null : ($postgres
                ? Carbon::parse($value, config('app.timezone'))->utc()->toIso8601String()
                : Carbon::parse($value, config('app.timezone'))->timezone(config('app.timezone'))->format('Y-m-d H:i:s')),
        );
    }

    public function oprec(): BelongsTo { return $this->belongsTo(Oprec::class); }
    public function submissions(): HasMany { return $this->hasMany(OprecTestSubmission::class, 'oprec_stage_id'); }
}
