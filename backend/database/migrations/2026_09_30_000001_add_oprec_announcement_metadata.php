<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('oprecs', function (Blueprint $table) {
            $table->string('pengumuman_judul', 200)->nullable();
            $table->string('pengumuman_poster')->nullable();
            $table->string('pengumuman_grup_wa', 500)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('oprecs', fn (Blueprint $table) => $table->dropColumn([
            'pengumuman_judul', 'pengumuman_poster', 'pengumuman_grup_wa',
        ]));
    }
};
