<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('event_form_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->string('scope', 16)->default('personal');
            $table->string('edit_role', 16)->default('all');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
        Schema::table('event_form_fields', function (Blueprint $table) {
            $table->foreignId('group_id')->nullable()->after('event_id')->constrained('event_form_groups')->nullOnDelete();
        });
        Schema::create('event_group_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('event_form_groups')->cascadeOnDelete();
            $table->string('owner_type', 12);
            $table->unsignedBigInteger('owner_id');
            $table->jsonb('form_data');
            $table->timestamps();
            $table->unique(['group_id', 'owner_type', 'owner_id'], 'event_group_owner_unique');
            $table->index(['event_id', 'owner_type', 'owner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_group_submissions');
        Schema::table('event_form_fields', fn (Blueprint $table) => $table->dropConstrainedForeignId('group_id'));
        Schema::dropIfExists('event_form_groups');
    }
};
