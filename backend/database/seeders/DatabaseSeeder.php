<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('site_contents')->updateOrInsert(['id' => 1], ['misi' => '[]', 'statistik' => '{}', 'sosial_media' => '{}', 'created_at' => now(), 'updated_at' => now()]);

        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        if ($email && $password && strlen($password) >= 12) {
            if (!User::where('email', $email)->exists()) {
                $admin = new User;
                $admin->forceFill(['email' => $email, 'nama' => 'Admin HIMANIKA', 'name' => 'Admin HIMANIKA', 'password' => $password, 'role' => 'admin'])->save();
            }
        }
    }
}
