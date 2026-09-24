<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') return;
        DB::unprepared(<<<'SQL'
            CREATE FUNCTION prevent_event_mode_change_after_enrollment()
            RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
                IF NEW.tipe_pendaftaran IS DISTINCT FROM OLD.tipe_pendaftaran
                    AND EXISTS (SELECT 1 FROM event_enrollments WHERE event_id = NEW.id) THEN
                    RAISE EXCEPTION 'Registration mode cannot change after enrollment';
                END IF;
                RETURN NEW;
            END;
            $$;
            CREATE TRIGGER event_mode_locked_after_enrollment
            BEFORE UPDATE OF tipe_pendaftaran ON events
            FOR EACH ROW EXECUTE FUNCTION prevent_event_mode_change_after_enrollment();
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') return;
        DB::unprepared(<<<'SQL'
            DROP TRIGGER IF EXISTS event_mode_locked_after_enrollment ON events;
            DROP FUNCTION IF EXISTS prevent_event_mode_change_after_enrollment();
        SQL);
    }
};
