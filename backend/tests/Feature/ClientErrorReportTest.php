<?php

namespace Tests\Feature;

use App\Models\AuditEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientErrorReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_browser_connection_failures_are_logged_once_each(): void
    {
        $this->postJson('/api/public/client-errors', ['reports' => [
            ['at' => now()->subMinutes(5)->toIso8601String(), 'page' => '/oprec', 'endpoint' => '/user/oprec/register', 'method' => 'POST', 'error' => 'ERR_NETWORK', 'online' => true],
            ['at' => now()->subMinute()->toIso8601String(), 'page' => '/', 'endpoint' => '/public/home', 'method' => 'GET', 'error' => 'ECONNABORTED'],
        ]])->assertCreated()->assertJsonPath('data.recorded', 2);

        $this->assertSame(2, AuditEntry::count());
        $entry = AuditEntry::where('action', 'system.client_network')->first();
        $this->assertSame(['error', 'failed', 'Koneksi gagal dari sisi pengguna'], [$entry->kind, $entry->result, $entry->summary]);
        $this->assertSame('/user/oprec/register', $entry->context['endpoint']);
    }

    public function test_reports_are_validated(): void
    {
        $this->postJson('/api/public/client-errors', ['reports' => [['page' => '/']]])->assertStatus(422);
        $this->postJson('/api/public/client-errors', ['reports' => array_fill(0, 21, ['at' => now()->toIso8601String()])])->assertStatus(422);
    }
}
