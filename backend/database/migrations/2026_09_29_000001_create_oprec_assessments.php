<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('oprec_registrations', function (Blueprint $table) {
            $table->string('accepted_position', 150)->nullable();
        });
        Schema::create('oprec_assessment_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oprec_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestampTz('revoked_at')->nullable();
            $table->timestamps();
            $table->unique(['oprec_id', 'user_id']);
        });
        Schema::create('oprec_assessment_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oprec_registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reviewer_name');
            foreach (['pemahaman', 'kepribadian', 'public_speaking', 'kejujuran', 'problem_solving', 'kerja_sama'] as $field) {
                $table->decimal($field, 3, 1)->nullable();
            }
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['oprec_registration_id', 'reviewer_id'], 'oprec_review_reviewer_unique');
        });
        Schema::create('oprec_assessment_decision_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oprec_registration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('old_status', 12);
            $table->string('new_status', 12);
            $table->foreignId('old_division_id')->nullable();
            $table->foreignId('new_division_id')->nullable();
            $table->string('old_position', 150)->nullable();
            $table->string('new_position', 150)->nullable();
            $table->timestampTz('created_at');
            $table->index(['oprec_registration_id', 'created_at'], 'oprec_decision_history_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oprec_assessment_decision_logs');
        Schema::dropIfExists('oprec_assessment_reviews');
        Schema::dropIfExists('oprec_assessment_assignments');
        Schema::table('oprec_registrations', fn (Blueprint $table) => $table->dropColumn('accepted_position'));
    }
};
