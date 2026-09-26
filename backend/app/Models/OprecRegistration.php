<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OprecRegistration extends Model
{
    protected $fillable = ['oprec_id', 'user_id', 'nim', 'tanggal_lahir', 'form_data', 'file_uploads', 'divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3', 'accepted_division_id', 'status', 'catatan'];
    protected $hidden = ['nim', 'tanggal_lahir', 'form_data', 'file_uploads'];
    protected function casts(): array { return ['tanggal_lahir' => 'date', 'form_data' => 'array', 'file_uploads' => 'array']; }
    public function oprec() { return $this->belongsTo(Oprec::class); }
    public function user() { return $this->belongsTo(User::class); }
}
