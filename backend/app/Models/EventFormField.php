<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventFormField extends Model
{
    public $timestamps = false;
    protected $fillable = ['event_id', 'name', 'label', 'type', 'required', 'options', 'sort_order'];
    protected function casts(): array { return ['required' => 'boolean', 'options' => 'array']; }
    public function event() { return $this->belongsTo(Event::class); }
}
