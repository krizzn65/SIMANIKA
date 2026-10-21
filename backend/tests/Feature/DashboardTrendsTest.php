<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTrendsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_zero_filled_daily_sign_ups(): void
    {
        $admin = $this->verifiedUser(['name' => 'Admin', 'email' => 'admin-trend@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $old = $this->verifiedUser(['name' => 'Lama', 'email' => 'old-trend@example.test', 'password' => 'secret-password']);
        $old->forceFill(['created_at' => now()->subDays(200)])->save();

        $trends = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard')->assertOk()->json('trends');

        $this->assertCount(90, $trends);
        $this->assertSame(now('Asia/Jakarta')->toDateString(), end($trends)['date']);
        $this->assertSame(1, array_sum(array_column($trends, 'users')));
        $this->assertSame(0, array_sum(array_column($trends, 'events')) + array_sum(array_column($trends, 'oprec')));
    }
}
