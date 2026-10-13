<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Oprec extends Model
{
    protected $fillable = ['periode', 'status', 'headline', 'deskripsi', 'poster', 'poster_alt', 'tanggal_buka', 'tanggal_tutup', 'first_published_at', 'schema_version', 'form_intro', 'link_grup_wa', 'form_fields', 'faq', 'pengumuman_published', 'pengumuman_tanggal', 'pengumuman_pesan'];
    protected function casts(): array { return ['tanggal_buka' => 'datetime', 'tanggal_tutup' => 'datetime', 'first_published_at' => 'datetime', 'pengumuman_published' => 'boolean', 'form_fields' => 'array', 'faq' => 'array']; }
    /** Keep the offset when PostgreSQL binds a timestamp with time zone. */
    protected function pengumumanTanggal(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value === null ? null : Carbon::parse($value, 'UTC'),
            set: fn ($value) => $value === null ? null : Carbon::parse($value, config('app.timezone'))->utc()->toIso8601String(),
        );
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
    public function divisions(): HasMany { return $this->hasMany(OprecDivision::class)->orderBy('sort_order'); }
    public function registrations(): HasMany { return $this->hasMany(OprecRegistration::class); }
    public function writtenTest(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(OprecStage::class)->where('type', 'test_tulis');
    }

    /** Allow admin links to use a readable period slug while preserving legacy numeric IDs. */
    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        if ($field) return $query->where($field, $value);
        if (ctype_digit((string) $value)) return $query->whereKey((int) $value);
        $period = str_replace('-', '/', urldecode((string) $value));
        return $query->where('periode', $period);
    }
}
