<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditEntry extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'kind', 'module', 'action', 'result', 'summary', 'actor_id', 'actor_name',
        'actor_role', 'target_type', 'target_id', 'ip_address', 'request_id',
        'method', 'route', 'http_status', 'context',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime', 'context' => 'array', 'http_status' => 'integer'];
    }
}
