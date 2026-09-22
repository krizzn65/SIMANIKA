<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventPrize extends Model
{
    public $timestamps = false;
    protected $fillable = ['event_id', 'label', 'sort_order'];
    public function event() { return $this->belongsTo(Event::class); }
}
