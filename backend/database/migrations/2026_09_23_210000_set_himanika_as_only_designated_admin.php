<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function (): void {
            DB::table('users')->whereRaw('LOWER(email) = ?', ['jajaldisek123@gmail.com'])->update(['role' => 'user']);
            DB::table('users')->whereRaw('LOWER(email) = ?', ['krisnadewa6565@gmail.com'])->update(['role' => 'user']);
            DB::table('users')->whereRaw('LOWER(email) = ?', ['himanikamif@gmail.com'])->update(['role' => 'admin']);
        });
    }

    public function down(): void
    {
        // Do not restore elevated access automatically.
    }
};
