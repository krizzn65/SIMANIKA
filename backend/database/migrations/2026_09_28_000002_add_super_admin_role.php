<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public $withinTransaction = false;

    public function up(): void
    {
        $officialEmail = User::configuredAdminEmail();

        if (DB::getDriverName() === 'pgsql') {
            $column = DB::selectOne("SELECT data_type, udt_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role'");
            if ($column?->data_type === 'USER-DEFINED') {
                foreach (['super_admin', 'leader', 'kwu'] as $role) {
                    $type = '"' . str_replace('"', '""', $column->udt_name) . '"';
                    DB::statement("ALTER TYPE {$type} ADD VALUE IF NOT EXISTS '{$role}'");
                }
            }
        }

        DB::transaction(function () use ($officialEmail) {
            // Old non-designated admin values never had admin access. Do not turn
            // them into privileged accounts when introducing assignable admin roles.
            $stale = DB::table('users')->whereIn('role', ['admin', 'super_admin']);
            if ($officialEmail) $stale->whereRaw('LOWER(email) <> ?', [$officialEmail]);
            $stale->update(['role' => 'user']);

            if ($officialEmail) {
                DB::table('users')->whereRaw('LOWER(email) = ?', [$officialEmail])->whereIn('role', ['admin', 'super_admin'])
                    ->update(['role' => 'super_admin']);
            }

        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("CREATE UNIQUE INDEX users_one_super_admin ON users ((CASE WHEN role = 'super_admin' THEN 1 ELSE NULL END))");
        } else {
            DB::statement("CREATE UNIQUE INDEX users_one_super_admin ON users (role) WHERE role = 'super_admin'");
        }
        if (in_array(DB::getDriverName(), ['pgsql', 'mysql'], true)) {
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_allowed CHECK (role IN ('super_admin', 'admin', 'leader', 'kwu', 'user'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_allowed');
            DB::statement('DROP INDEX IF EXISTS users_one_super_admin');
        } elseif (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE users DROP CHECK users_role_allowed');
            DB::statement('DROP INDEX users_one_super_admin ON users');
        } else {
            DB::statement('DROP INDEX IF EXISTS users_one_super_admin');
        }
        DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
    }
};
