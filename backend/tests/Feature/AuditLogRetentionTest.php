<?php

namespace Tests\Feature;

use App\Models\AuditEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuditLogRetentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_prune_uses_calendar_dates_in_jakarta_and_dry_run_does_not_delete(): void
    {
        $this->travelTo(Carbon::parse('2026-11-01 12:00:00', 'Asia/Jakarta'));

        $old = $this->insertEntry('2026-10-26 23:59:59');
        $boundary = $this->insertEntry('2026-10-27 00:00:00');
        $today = $this->insertEntry('2026-11-01 00:00:00');

        $this->assertSame(0, Artisan::call('audit:prune', ['--dry-run' => true]));
        $this->assertStringContainsString('Akan dihapus: 1', Artisan::output());
        $this->assertSame(3, AuditEntry::count());

        $this->assertSame(0, Artisan::call('audit:prune'));
        $this->assertStringContainsString('Dihapus: 1', Artisan::output());
        $this->assertNull(AuditEntry::find($old));
        $this->assertNotNull(AuditEntry::find($boundary));
        $this->assertNotNull(AuditEntry::find($today));

        $this->assertSame(0, Artisan::call('audit:prune'));
        $this->assertSame(2, AuditEntry::count());
    }

    public function test_prune_is_scheduled_daily_in_jakarta(): void
    {
        $event = collect(Schedule::events())->first(fn ($candidate) => str_contains((string) $candidate->command, 'audit:prune'));

        $this->assertNotNull($event);
        $this->assertSame('5 0 * * *', $event->expression);
        $this->assertSame('Asia/Jakarta', $event->timezone);
    }

    private function insertEntry(string $jakartaTime): int
    {
        return DB::table('audit_entries')->insertGetId([
            'created_at' => Carbon::parse($jakartaTime, 'Asia/Jakarta')->utc()->format('Y-m-d H:i:s'),
            'kind' => 'activity',
            'module' => 'system',
            'action' => 'system.test',
            'result' => 'success',
            'summary' => 'Log uji retensi',
            'request_id' => Str::uuid()->toString(),
            'method' => 'POST',
            'route' => 'api/test',
            'http_status' => 200,
        ]);
    }
}
