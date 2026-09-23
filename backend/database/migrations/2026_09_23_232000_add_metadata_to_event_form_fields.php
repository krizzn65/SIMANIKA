<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_form_fields', function (Blueprint $table) {
            $table->string('help', 500)->nullable();
            $table->string('placeholder', 250)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('event_form_fields', fn (Blueprint $table) => $table->dropColumn(['help', 'placeholder']));
    }
};
