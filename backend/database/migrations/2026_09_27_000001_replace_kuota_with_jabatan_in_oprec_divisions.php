<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('oprec_divisions', function (Blueprint $table) {
            if (Schema::hasColumn('oprec_divisions', 'kuota')) {
                $table->dropColumn('kuota');
            }
            if (!Schema::hasColumn('oprec_divisions', 'jabatan')) {
                $table->jsonb('jabatan')->default('[]');
            }
        });
    }

    public function down(): void
    {
        Schema::table('oprec_divisions', function (Blueprint $table) {
            if (Schema::hasColumn('oprec_divisions', 'jabatan')) {
                $table->dropColumn('jabatan');
            }
            if (!Schema::hasColumn('oprec_divisions', 'kuota')) {
                $table->unsignedInteger('kuota')->nullable();
            }
        });
    }
};
