<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('team_code_sequences', function (Blueprint $table) {
            $table->string('prefix', 6)->primary();
            $table->unsignedBigInteger('last_number')->default(0);
        });
        Schema::create('team_code_reservations', function (Blueprint $table) {
            $table->string('code', 16)->primary();
        });

        // Existing codes stay valid, even when older events reused a prefix/code.
        $prefixes = DB::table('events')->whereNotNull('kode_prefix')->distinct()->pluck('kode_prefix');
        $codes = DB::table('teams')->distinct()->pluck('kode_unik');
        foreach ($codes as $code) DB::table('team_code_reservations')->insertOrIgnore(['code' => $code]);
        foreach ($prefixes as $prefix) {
            $last = 0;
            foreach ($codes as $code) {
                if (!str_starts_with($code, $prefix)) continue;
                $suffix = substr($code, strlen($prefix));
                if (preg_match('/^[0-9]{2,10}$/', $suffix)) $last = max($last, (int) $suffix);
            }
            $last = max($last, (int) DB::table('events')->where('kode_prefix', $prefix)->max('last_team_number'));
            DB::table('team_code_sequences')->insert(['prefix' => $prefix, 'last_number' => $last]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('team_code_reservations');
        Schema::dropIfExists('team_code_sequences');
    }
};
