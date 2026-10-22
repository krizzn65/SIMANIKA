<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // A shareable link that unlocks the dashboard testimonial form.
        Schema::create('testimonial_invites', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->unsignedInteger('quota')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
        // Accounts that opened the link, and whether they already submitted.
        Schema::create('testimonial_invite_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('testimonial_invite_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['testimonial_invite_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonial_invite_users');
        Schema::dropIfExists('testimonial_invites');
    }
};
