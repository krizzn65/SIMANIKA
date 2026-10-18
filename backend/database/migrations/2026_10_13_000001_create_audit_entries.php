<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_entries', function (Blueprint $table) {
            $table->id();
            $table->timestampTz('created_at')->useCurrent();
            $table->string('kind', 12);
            $table->string('module', 32);
            $table->string('action', 80);
            $table->string('result', 12);
            $table->string('summary', 200);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('actor_name', 150)->nullable();
            $table->string('actor_role', 24)->nullable();
            $table->string('target_type', 40)->nullable();
            $table->string('target_id', 80)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->uuid('request_id');
            $table->string('method', 10);
            $table->string('route', 200);
            $table->unsignedSmallInteger('http_status');
            $table->jsonb('context')->nullable();
            $table->index(['kind', 'created_at']);
            $table->index(['module', 'created_at']);
            $table->index(['actor_id', 'created_at']);
            $table->index(['result', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_entries');
    }
};
