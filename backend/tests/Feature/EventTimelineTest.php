<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use App\Support\EventTimeline;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class EventTimelineTest extends TestCase
{
    use RefreshDatabase;

    private function item(string $type, string $date, ?int $batch = null): array
    {
        return ['type' => $type, 'batch' => $batch, 'judul' => $type, 'tanggal' => $date];
    }

    public function test_timeline_is_sorted_by_date_and_uses_latest_batch(): void
    {
        $result = EventTimeline::schedule([
            $this->item('registration_open', '2026-09-10', 1),
            $this->item('registration_close', '2026-09-15', 1),
            $this->item('proposal', '2026-09-09'),
            $this->item('registration_open', '2026-09-16', 2),
            $this->item('registration_close', '2026-09-20', 2),
            $this->item('awarding', '2026-09-21'),
        ]);
        $this->assertSame('proposal', $result['timeline'][0]['type']);
        $this->assertSame('Pendaftaran Batch 1', $result['timeline'][1]['judul']);
        $this->assertSame('2026-09-16', $result['buka_pendaftaran']);
        $this->assertSame('2026-09-20', $result['deadline_pendaftaran']);
        $event = new Event(array_merge($result, ['status' => 'published']));
        [$open, $close] = EventTimeline::registrationTimes($event);
        $this->assertSame('2026-09-16 00:00', $open->format('Y-m-d H:i'));
        $this->assertSame('2026-09-20 23:59', $close->format('Y-m-d H:i'));
    }

    public function test_registration_pair_cannot_be_split(): void
    {
        $this->expectException(ValidationException::class);
        EventTimeline::schedule([$this->item('registration_open', '2026-09-10', 1), $this->item('proposal', '2026-09-12')]);
    }

    public function test_awarding_on_registration_closing_day_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        EventTimeline::schedule([
            $this->item('registration_open', '2026-09-10', 1),
            $this->item('registration_close', '2026-09-15', 1),
            $this->item('awarding', '2026-09-15'),
        ]);
    }

    public function test_admin_cannot_override_dates_derived_from_typed_timeline(): void
    {
        config()->set('admin.email', 'timeline-admin@example.test');
        $admin = User::create(['name' => 'Timeline Admin', 'email' => 'timeline-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'admin'])->save();
        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/events', [
            'slug' => 'timeline-authoritative', 'judul' => 'Timeline authoritative', 'kategori' => 'hi-fest',
            'tanggal_mulai' => '2035-01-01', 'tanggal_selesai' => '2035-01-02',
            'buka_pendaftaran' => '2035-01-01', 'deadline_pendaftaran' => '2035-01-02',
            'tipe' => 'online', 'status' => 'draft', 'tipe_pendaftaran' => 'individu', 'payment_type' => 'free',
            'timeline' => [
                $this->item('registration_open', '2026-09-10', 1),
                $this->item('registration_close', '2026-09-15', 1),
                $this->item('proposal', '2026-09-09'),
            ],
        ])->assertCreated();
        $event = Event::where('slug', 'timeline-authoritative')->firstOrFail();
        $this->assertSame('2026-09-10', $event->buka_pendaftaran->format('Y-m-d'));
        $this->assertSame('2026-09-15', $event->deadline_pendaftaran->format('Y-m-d'));
        $this->assertSame('proposal', $event->timeline[0]['type']);
    }
}
