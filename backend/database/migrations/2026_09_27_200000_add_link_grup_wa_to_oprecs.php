<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('oprecs', function (Blueprint $table) {
            $table->string('link_grup_wa', 500)->nullable()->after('form_intro');
        });
    }

    public function down(): void
    {
        Schema::table('oprecs', function (Blueprint $table) {
            $table->dropColumn('link_grup_wa');
        });
    }
};
