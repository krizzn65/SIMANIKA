<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $fillable = ['event_id', 'kode_unik', 'nama_tim', 'ketua_id', 'jumlah_anggota', 'completion_status', 'review_status', 'form_data', 'catatan'];
    protected function casts(): array { return ['form_data' => 'array']; }
    public function event() { return $this->belongsTo(Event::class); }
    public function ketua() { return $this->belongsTo(User::class, 'ketua_id'); }
    public function members() { return $this->belongsToMany(User::class, 'team_members')->withPivot('event_id', 'joined_at'); }
}
