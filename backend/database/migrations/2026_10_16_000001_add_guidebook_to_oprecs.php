<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('oprecs', function (Blueprint $table) {
            $table->string('guidebook')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('oprecs', fn (Blueprint $table) => $table->dropColumn('guidebook'));
    }
};
