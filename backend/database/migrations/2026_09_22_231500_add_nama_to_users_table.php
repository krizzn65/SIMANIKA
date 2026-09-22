<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nama')->nullable()->after('id');
        });

        // Sinkronkan nama yang sudah ada dari kolom name jika ada
        DB::table('users')
            ->whereNull('nama')
            ->whereNotNull('name')
            ->update(['nama' => DB::raw('name')]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('nama');
        });
    }
};
