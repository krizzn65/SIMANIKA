<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'nim')) {
                $table->dropUnique('users_nim_unique');
                $table->dropColumn('nim');
            }
            $columns = array_filter(['jurusan', 'angkatan', 'foto_profil'], fn (string $column) => Schema::hasColumn('users', $column));
            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nim', 32)->nullable()->unique();
            $table->string('jurusan')->nullable();
            $table->smallInteger('angkatan')->nullable();
            $table->string('foto_profil')->nullable();
        });
    }
};
