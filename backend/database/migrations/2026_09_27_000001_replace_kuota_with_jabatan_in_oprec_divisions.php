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

        // Backfill existing divisions with default positions
        $divisions = \Illuminate\Support\Facades\DB::table('oprec_divisions')->get();
        foreach ($divisions as $d) {
            $current = json_decode($d->jabatan ?? '[]', true);
            if (empty($current)) {
                $clean = trim($d->nama ?? '');
                if (strcasecmp($clean, 'bph') === 0) {
                    $default = ['Wakil Ketua Umum', 'Sekretaris 2', 'Bendahara 2'];
                } elseif ($clean !== '') {
                    $default = ['Staff Divisi ' . $clean];
                } else {
                    $default = [];
                }
                \Illuminate\Support\Facades\DB::table('oprec_divisions')
                    ->where('id', $d->id)
                    ->update(['jabatan' => json_encode($default)]);
            }
        }
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
