<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Support\JsonDefault;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('oprec_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('oprec_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('headline', 300);
            $table->text('deskripsi')->nullable();
            $table->string('poster', 2048)->nullable();
            $table->timestampTz('tanggal_buka');
            $table->timestampTz('tanggal_tutup')->nullable();
            $table->boolean('published')->default(false);
            $table->jsonb('form_fields')->default(JsonDefault::value('[]'));
            $table->timestamps();
            $table->unique(['oprec_id', 'type']);
        });
    }

    public function down(): void { Schema::dropIfExists('oprec_stages'); }
};
