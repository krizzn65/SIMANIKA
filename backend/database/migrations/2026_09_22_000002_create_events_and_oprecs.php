<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Support\JsonDefault;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->string('kategori', 16);
            $table->string('poster')->nullable();
            $table->timestampTz('tanggal_mulai');
            $table->timestampTz('tanggal_selesai');
            $table->timestampTz('buka_pendaftaran')->nullable();
            $table->timestampTz('deadline_pendaftaran')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('tipe', 10)->default('offline');
            $table->unsignedInteger('kuota')->nullable();
            $table->string('status', 12)->default('draft');
            $table->string('tipe_pendaftaran', 10)->default('individu');
            $table->string('kode_prefix', 6)->nullable();
            $table->unsignedSmallInteger('min_anggota')->nullable();
            $table->unsignedSmallInteger('max_anggota')->nullable();
            $table->unsignedInteger('kuota_tim')->nullable();
            $table->unsignedInteger('last_team_number')->default(0);
            $table->string('registration_url')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'tanggal_mulai']);
            $table->index(['kategori', 'status']);
        });
        Schema::create('event_form_fields', function (Blueprint $table) { $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete(); $table->string('name'); $table->string('label'); $table->string('type', 20); $table->boolean('required')->default(false); $table->jsonb('options')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); $table->unique(['event_id', 'name']); });
        Schema::create('event_prizes', function (Blueprint $table) { $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete(); $table->string('label'); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('event_requirements', function (Blueprint $table) { $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete(); $table->string('label'); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('teams', function (Blueprint $table) { $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete(); $table->string('kode_unik', 16); $table->string('nama_tim'); $table->foreignId('ketua_id')->constrained('users')->restrictOnDelete(); $table->unsignedSmallInteger('jumlah_anggota')->default(1); $table->string('completion_status', 12)->default('incomplete'); $table->string('review_status', 12)->default('pending'); $table->jsonb('form_data')->nullable(); $table->text('catatan')->nullable(); $table->timestamps(); $table->unique(['event_id', 'kode_unik']); });
        Schema::create('team_members', function (Blueprint $table) { $table->id(); $table->foreignId('team_id')->constrained()->cascadeOnDelete(); $table->foreignId('event_id')->constrained()->cascadeOnDelete(); $table->foreignId('user_id')->constrained()->cascadeOnDelete(); $table->timestampTz('joined_at')->useCurrent(); $table->unique(['team_id', 'user_id']); $table->unique(['event_id', 'user_id']); });
        Schema::create('event_registrations', function (Blueprint $table) { $table->id(); $table->foreignId('event_id')->constrained()->cascadeOnDelete(); $table->foreignId('user_id')->constrained()->cascadeOnDelete(); $table->jsonb('form_data')->nullable(); $table->string('status', 12)->default('pending'); $table->text('catatan')->nullable(); $table->timestamps(); $table->unique(['event_id', 'user_id']); });
        Schema::create('oprecs', function (Blueprint $table) { $table->id(); $table->string('periode')->unique(); $table->string('status', 12)->default('closed'); $table->string('headline')->nullable(); $table->text('deskripsi')->nullable(); $table->string('poster')->nullable(); $table->string('poster_alt')->nullable(); $table->timestampTz('tanggal_buka')->nullable(); $table->timestampTz('tanggal_tutup')->nullable(); $table->string('schema_version')->default('1'); $table->text('form_intro')->nullable(); $table->jsonb('form_fields')->default(JsonDefault::value('[]')); $table->jsonb('faq')->default(JsonDefault::value('[]')); $table->boolean('pengumuman_published')->default(false); $table->timestampTz('pengumuman_tanggal')->nullable(); $table->text('pengumuman_pesan')->nullable(); $table->timestamps(); $table->index(['status', 'tanggal_buka']); });
        Schema::create('oprec_divisions', function (Blueprint $table) { $table->id(); $table->foreignId('oprec_id')->constrained()->cascadeOnDelete(); $table->string('nama'); $table->string('nama_lengkap')->nullable(); $table->text('deskripsi')->nullable(); $table->string('logo')->nullable(); $table->unsignedInteger('kuota')->nullable(); $table->unsignedSmallInteger('sort_order')->default(0); });
        Schema::create('oprec_registrations', function (Blueprint $table) { $table->id(); $table->foreignId('oprec_id')->constrained()->cascadeOnDelete(); $table->foreignId('user_id')->constrained()->cascadeOnDelete(); $table->string('nim', 32); $table->date('tanggal_lahir'); $table->jsonb('form_data'); $table->jsonb('file_uploads')->nullable(); $table->foreignId('divisi_pilihan_1')->nullable(); $table->foreignId('divisi_pilihan_2')->nullable(); $table->foreignId('accepted_division_id')->nullable(); $table->string('status', 12)->default('pending'); $table->text('catatan')->nullable(); $table->timestamps(); $table->unique(['oprec_id', 'nim']); $table->unique(['oprec_id', 'user_id']); });
        Schema::create('file_uploads', function (Blueprint $table) { $table->id(); $table->foreignId('user_id')->constrained()->cascadeOnDelete(); $table->string('owner_type', 32); $table->unsignedBigInteger('owner_id'); $table->string('field_name'); $table->string('disk'); $table->string('path'); $table->string('mime_type', 100); $table->unsignedBigInteger('size'); $table->timestamps(); $table->index(['owner_type', 'owner_id']); });
    }

    public function down(): void
    {
        foreach (['file_uploads', 'oprec_registrations', 'oprec_divisions', 'oprecs', 'event_registrations', 'team_members', 'teams', 'event_requirements', 'event_prizes', 'event_form_fields', 'events'] as $table) Schema::dropIfExists($table);
    }
};
