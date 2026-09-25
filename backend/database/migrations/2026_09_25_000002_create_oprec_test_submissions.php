<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('oprec_test_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oprec_stage_id')->constrained('oprec_stages')->cascadeOnDelete();
            $table->foreignId('oprec_registration_id')->constrained('oprec_registrations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->jsonb('answers');
            $table->timestamps();
            $table->unique(['oprec_stage_id', 'user_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('oprec_test_submissions'); }
};
