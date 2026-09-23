<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'foto_profil')) {
            Schema::table('users', fn (Blueprint $table) => $table->string('foto_profil')->nullable());
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'foto_profil')) {
            Schema::table('users', fn (Blueprint $table) => $table->dropColumn('foto_profil'));
        }
    }
};
