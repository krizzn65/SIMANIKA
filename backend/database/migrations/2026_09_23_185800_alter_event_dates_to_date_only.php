<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\Event;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // These USING casts are PostgreSQL-specific. SQLite tests already accept
        // the original timestamp affinity, so only PostgreSQL needs the DDL change.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE events ALTER COLUMN tanggal_mulai TYPE date USING tanggal_mulai::date');
            DB::statement('ALTER TABLE events ALTER COLUMN tanggal_selesai TYPE date USING tanggal_selesai::date');
            DB::statement('ALTER TABLE events ALTER COLUMN buka_pendaftaran TYPE date USING buka_pendaftaran::date');
            DB::statement('ALTER TABLE events ALTER COLUMN deadline_pendaftaran TYPE date USING deadline_pendaftaran::date');
        }

        // Clean up existing timeline JSON data to date-only (YYYY-MM-DD)
        $events = Event::all();
        foreach ($events as $event) {
            if (is_array($event->timeline)) {
                $cleanedTimeline = [];
                foreach ($event->timeline as $item) {
                    if (isset($item['tanggal'])) {
                        $item['tanggal'] = substr($item['tanggal'], 0, 10);
                    }
                    $cleanedTimeline[] = $item;
                }
                $event->timeline = $cleanedTimeline;
                $event->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE events ALTER COLUMN tanggal_mulai TYPE timestamp(0) with time zone USING tanggal_mulai::timestamp with time zone');
            DB::statement('ALTER TABLE events ALTER COLUMN tanggal_selesai TYPE timestamp(0) with time zone USING tanggal_selesai::timestamp with time zone');
            DB::statement('ALTER TABLE events ALTER COLUMN buka_pendaftaran TYPE timestamp(0) with time zone USING buka_pendaftaran::timestamp with time zone');
            DB::statement('ALTER TABLE events ALTER COLUMN deadline_pendaftaran TYPE timestamp(0) with time zone USING deadline_pendaftaran::timestamp with time zone');
        }
    }
};
