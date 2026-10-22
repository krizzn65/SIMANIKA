<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('site_content_id')->constrained('users')->nullOnDelete();
            $table->string('status', 20)->default('approved')->after('quote');
            $table->boolean('is_visible')->default(true)->after('status');
            $table->timestamps();
        });

        DB::table('testimonials')->update([
            'status' => 'approved',
            'is_visible' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'status', 'is_visible', 'created_at', 'updated_at']);
        });
    }
};
