<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('site_contents', function (Blueprint $table) {
            $table->boolean('gallery_managed')->default(false);
            $table->boolean('testimonials_managed')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('site_contents', function (Blueprint $table) {
            $table->dropColumn(['gallery_managed', 'testimonials_managed']);
        });
    }
};
