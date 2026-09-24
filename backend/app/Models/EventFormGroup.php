<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventFormGroup extends Model
{
    protected $fillable = ['event_id', 'title', 'scope', 'edit_role', 'sort_order'];
    public function fields(): HasMany { return $this->hasMany(EventFormField::class, 'group_id')->orderBy('sort_order'); }
}
