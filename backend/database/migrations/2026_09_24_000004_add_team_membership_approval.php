<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            // Existing members remain accepted; new join requests explicitly use pending.
            $table->string('status', 12)->default('accepted')->index();
        });
        Schema::table('teams', function (Blueprint $table) {
            $table->timestampTz('form_submitted_at')->nullable();
        });
        DB::table('teams')->whereNotNull('form_data')->orderBy('id')->chunkById(100, function ($teams) {
            foreach ($teams as $team) {
                if (!empty(json_decode($team->form_data, true))) {
                    DB::table('teams')->where('id', $team->id)->update(['form_submitted_at' => $team->updated_at]);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('teams', fn (Blueprint $table) => $table->dropColumn('form_submitted_at'));
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};
