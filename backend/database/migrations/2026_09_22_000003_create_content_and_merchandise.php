<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Support\JsonDefault;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('merchandises', function (Blueprint $table) { $table->id(); $table->string('nama_instansi'); $table->string('logo')->nullable(); $table->string('tier', 20); $table->string('website')->nullable(); $table->text('deskripsi')->nullable(); $table->foreignId('event_id')->nullable()->constrained()->nullOnDelete(); $table->boolean('aktif')->default(true); $table->timestamps(); });
        Schema::create('merchandise_inquiries', function (Blueprint $table) { $table->id(); $table->string('nama_kontak'); $table->string('nama_instansi'); $table->string('email'); $table->string('paket_diminati'); $table->text('pesan'); $table->string('status', 12)->default('unread'); $table->timestamps(); });
        Schema::create('site_contents', function (Blueprint $table) { $table->id(); $table->string('hero_tagline')->nullable(); $table->text('hero_subtitle')->nullable(); $table->text('about')->nullable(); $table->text('visi')->nullable(); $table->jsonb('misi')->default(JsonDefault::value('[]')); $table->jsonb('statistik')->default(JsonDefault::value('{}')); $table->jsonb('sosial_media')->default(JsonDefault::value('{}')); $table->timestamps(); });
        Schema::create('struktur_organisasi', function (Blueprint $table) { $table->id(); $table->foreignId('site_content_id')->constrained('site_contents')->cascadeOnDelete(); $table->string('nama'); $table->string('jabatan'); $table->string('foto')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('divisi', function (Blueprint $table) { $table->id(); $table->foreignId('site_content_id')->constrained('site_contents')->cascadeOnDelete(); $table->string('nama'); $table->string('nama_lengkap')->nullable(); $table->text('deskripsi')->nullable(); $table->string('icon')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('program_kerja', function (Blueprint $table) { $table->id(); $table->foreignId('site_content_id')->constrained('site_contents')->cascadeOnDelete(); $table->string('nama'); $table->text('deskripsi')->nullable(); $table->string('icon')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('galleries', function (Blueprint $table) { $table->id(); $table->foreignId('site_content_id')->constrained('site_contents')->cascadeOnDelete(); $table->string('image'); $table->string('alt')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('testimonials', function (Blueprint $table) { $table->id(); $table->foreignId('site_content_id')->constrained('site_contents')->cascadeOnDelete(); $table->string('nama'); $table->string('angkatan')->nullable(); $table->text('quote'); $table->string('foto')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); });
    }

    public function down(): void
    {
        foreach (['testimonials', 'galleries', 'program_kerja', 'divisi', 'struktur_organisasi', 'site_contents', 'merchandise_inquiries', 'merchandises'] as $table) Schema::dropIfExists($table);
    }
};
