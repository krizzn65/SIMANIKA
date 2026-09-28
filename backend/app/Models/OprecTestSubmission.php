<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OprecTestSubmission extends Model
{
    protected $fillable = ['oprec_stage_id', 'oprec_registration_id', 'user_id', 'answers'];

    protected function casts(): array { return ['answers' => 'array']; }

    public function stage(): BelongsTo { return $this->belongsTo(OprecStage::class, 'oprec_stage_id'); }
}
