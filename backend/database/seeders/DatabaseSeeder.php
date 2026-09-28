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

        $email = User::configuredAdminEmail();
        $password = env('ADMIN_PASSWORD');
        if ($email && $password && strlen($password) >= 12) {
            $admin = User::whereRaw('LOWER(email) = ?', [$email])->first();
            if (!$admin) {
                $admin = new User;
                $admin->forceFill(['email' => $email, 'nama' => 'Admin HIMANIKA', 'name' => 'Admin HIMANIKA', 'password' => $password, 'role' => User::ROLE_SUPER_ADMIN])->save();
            } elseif ($admin->role === User::ROLE_ADMIN) {
                $admin->forceFill(['role' => User::ROLE_SUPER_ADMIN])->save();
            }
        }
    }
}
