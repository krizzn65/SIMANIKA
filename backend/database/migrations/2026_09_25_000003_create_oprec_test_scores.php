<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('oprec_test_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('oprec_test_submissions')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('score', 5, 2);
            $table->string('note', 1000)->nullable();
            $table->timestamps();
            $table->unique(['submission_id', 'reviewer_id']);
            $table->index('reviewer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oprec_test_scores');
    }
};
