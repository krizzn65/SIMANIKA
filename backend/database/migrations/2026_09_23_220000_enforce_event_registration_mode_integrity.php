<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared(<<<'SQL'
            CREATE OR REPLACE FUNCTION enforce_event_registration_mode()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            BEGIN
                IF TG_TABLE_NAME = 'teams' THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM events
                        WHERE id = NEW.event_id AND tipe_pendaftaran = 'tim'
                    ) THEN
                        RAISE EXCEPTION 'Teams may only belong to team-registration events';
                    END IF;
                ELSIF TG_TABLE_NAME = 'event_registrations' THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM events
                        WHERE id = NEW.event_id AND tipe_pendaftaran = 'individu'
                    ) THEN
                        RAISE EXCEPTION 'Individual registrations may only belong to individual-registration events';
                    END IF;
                ELSIF TG_TABLE_NAME = 'team_members' THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM teams
                        WHERE id = NEW.team_id AND event_id = NEW.event_id
                    ) THEN
                        RAISE EXCEPTION 'Team member event must match its team event';
                    END IF;
                ELSIF TG_TABLE_NAME = 'events' THEN
                    IF NEW.tipe_pendaftaran IS DISTINCT FROM OLD.tipe_pendaftaran
                        AND (
                            EXISTS (SELECT 1 FROM teams WHERE event_id = NEW.id)
                            OR EXISTS (SELECT 1 FROM event_registrations WHERE event_id = NEW.id)
                        ) THEN
                        RAISE EXCEPTION 'Registration mode cannot change after registrations or teams exist';
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$;

            CREATE TRIGGER teams_require_team_event
            BEFORE INSERT OR UPDATE OF event_id ON teams
            FOR EACH ROW EXECUTE FUNCTION enforce_event_registration_mode();

            CREATE TRIGGER registrations_require_individual_event
            BEFORE INSERT OR UPDATE OF event_id ON event_registrations
            FOR EACH ROW EXECUTE FUNCTION enforce_event_registration_mode();

            CREATE TRIGGER team_members_require_matching_event
            BEFORE INSERT OR UPDATE OF team_id, event_id ON team_members
            FOR EACH ROW EXECUTE FUNCTION enforce_event_registration_mode();

            CREATE TRIGGER events_lock_registration_mode_after_data
            BEFORE UPDATE OF tipe_pendaftaran ON events
            FOR EACH ROW EXECUTE FUNCTION enforce_event_registration_mode();
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::unprepared(<<<'SQL'
            DROP TRIGGER IF EXISTS teams_require_team_event ON teams;
            DROP TRIGGER IF EXISTS registrations_require_individual_event ON event_registrations;
            DROP TRIGGER IF EXISTS team_members_require_matching_event ON team_members;
            DROP TRIGGER IF EXISTS events_lock_registration_mode_after_data ON events;
            DROP FUNCTION IF EXISTS enforce_event_registration_mode();
        SQL);
    }
};
