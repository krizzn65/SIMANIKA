<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('oprecs', function (Blueprint $table) {
            $table->timestampTz('first_published_at')->nullable();
        });

        DB::table('oprecs')->where('status', 'open')->update(['first_published_at' => DB::raw('COALESCE(tanggal_buka, created_at)')]);
        DB::table('oprecs')->whereNull('first_published_at')
            ->whereExists(fn ($query) => $query->selectRaw('1')->from('oprec_registrations')
                ->whereColumn('oprec_registrations.oprec_id', 'oprecs.id'))
            ->update(['first_published_at' => DB::raw('COALESCE(tanggal_buka, created_at)')]);
    }

    public function down(): void
    {
        Schema::table('oprecs', fn (Blueprint $table) => $table->dropColumn('first_published_at'));
    }
};
