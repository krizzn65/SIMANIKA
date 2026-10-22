<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DashboardTestimonialTest extends TestCase
{
    use RefreshDatabase;

    private function admin()
    {
        $admin = $this->verifiedUser(['name' => 'Admin', 'email' => 'admin-testi@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        return $admin;
    }

    private function user(string $email)
    {
        return $this->verifiedUser(['name' => 'Peserta', 'email' => $email, 'password' => 'secret-password']);
    }

    private function form(): array
    {
        return ['nama' => 'Peserta', 'angkatan' => 'Anggota 2025', 'quote' => 'HIMANIKA tempat belajar yang seru sekali.', 'photo' => UploadedFile::fake()->image('me.jpg', 800, 800)];
    }

    public function test_only_users_who_open_the_link_can_submit_once_for_approval(): void
    {
        Storage::fake('public');
        $admin = $this->admin();
        $invited = $this->user('invited@example.test');
        $other = $this->user('other@example.test');

        $this->actingAs($invited, 'sanctum')->postJson('/api/admin/home-content/testimonial-invite')->assertForbidden();
        $token = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/home-content/testimonial-invite', ['quota' => 5])->assertCreated()->json('data.token');

        $this->actingAs($other, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.open', false);
        $this->actingAs($other, 'sanctum')->post('/api/user/testimonial', $this->form(), ['Accept' => 'application/json'])->assertForbidden();
        $this->actingAs($invited, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => 'wrong'])->assertStatus(410);

        $this->actingAs($invited, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => $token])->assertOk();
        $this->actingAs($invited, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.open', true)->assertJsonPath('data.submitted', false);
        $this->actingAs($invited, 'sanctum')->post('/api/user/testimonial', $this->form(), ['Accept' => 'application/json'])->assertCreated();
        $this->actingAs($invited, 'sanctum')->post('/api/user/testimonial', $this->form(), ['Accept' => 'application/json'])->assertStatus(409);
        $this->actingAs($invited, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.submitted', true);

        $row = DB::table('testimonials')->where('user_id', $invited->id)->first();
        $this->assertSame(['pending', false], [$row->status, (bool) $row->is_visible]);
        $this->assertSame([], $this->getJson('/api/public/home')->json('data.testimonials'));
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/home-content/testimonial-invite')
            ->assertJsonPath('data.joined', 1)->assertJsonPath('data.submitted', 1);

        // A new link retires the old one.
        $this->actingAs($admin, 'sanctum')->postJson('/api/admin/home-content/testimonial-invite')->assertCreated();
        $this->actingAs($other, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => $token])->assertStatus(410);
    }

    public function test_quota_expiry_and_revoke_close_the_link(): void
    {
        $admin = $this->admin();
        $first = $this->user('first@example.test');
        $second = $this->user('second@example.test');

        $token = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/home-content/testimonial-invite', ['quota' => 1, 'expires_at' => now()->addDay()->toIso8601String()])->json('data.token');
        $this->actingAs($first, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => $token])->assertOk();
        $this->actingAs($first, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => $token])->assertOk();
        $this->actingAs($second, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => $token])->assertStatus(410);

        $this->travel(2)->days();
        $this->actingAs($first, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.open', false);

        $this->travelBack();
        $this->actingAs($admin, 'sanctum')->deleteJson('/api/admin/home-content/testimonial-invite')->assertOk();
        $this->actingAs($first, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.open', false);
        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/home-content/testimonial-invite')->assertJsonPath('data', null);
    }

    public function test_photo_is_required(): void
    {
        $admin = $this->admin();
        $user = $this->user('photo@example.test');
        $token = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/home-content/testimonial-invite')->json('data.token');
        $this->actingAs($user, 'sanctum')->postJson('/api/user/testimonial/claim', ['token' => $token])->assertOk();
        $this->actingAs($user, 'sanctum')->postJson('/api/user/testimonial', ['nama' => 'A', 'angkatan' => 'B', 'quote' => str_repeat('x', 30)])
            ->assertStatus(422)->assertJsonValidationErrors('photo');
    }
}
