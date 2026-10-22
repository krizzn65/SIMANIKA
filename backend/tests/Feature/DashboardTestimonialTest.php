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

    public function test_users_submit_once_while_open_and_wait_for_approval(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $admin = $this->verifiedUser(['name' => 'Admin', 'email' => 'admin-testi@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();
        $user = $this->verifiedUser(['name' => 'Peserta', 'email' => 'user-testi@example.test', 'password' => 'secret-password']);
        $form = fn () => ['nama' => 'Peserta', 'angkatan' => 'Anggota 2025', 'quote' => 'HIMANIKA tempat belajar yang seru sekali.', 'photo' => UploadedFile::fake()->image('me.jpg', 800, 800)];

        $this->actingAs($user, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.open', false);
        $this->actingAs($user, 'sanctum')->post('/api/user/testimonial', $form(), ['Accept' => 'application/json'])->assertStatus(409);
        $this->actingAs($user, 'sanctum')->putJson('/api/admin/home-content/testimonial-form', ['open' => true])->assertForbidden();

        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/home-content/testimonial-form', ['open' => true])->assertOk()->assertJsonPath('data.open', true);
        $this->actingAs($user, 'sanctum')->post('/api/user/testimonial', ['quote' => 'Tanpa foto tidak boleh dikirim ya.'] + $form(), ['Accept' => 'application/json'])->assertCreated();
        $this->actingAs($user, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.submitted', true);
        $this->actingAs($user, 'sanctum')->post('/api/user/testimonial', $form(), ['Accept' => 'application/json'])->assertStatus(409);

        $row = DB::table('testimonials')->where('user_id', $user->id)->first();
        $this->assertSame(['pending', false], [$row->status, (bool) $row->is_visible]);
        $this->assertTrue(Storage::disk('public')->exists($row->foto));
        $this->assertSame([], $this->getJson('/api/public/home')->json('data.testimonials'));

        // A new opening is a new round.
        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/home-content/testimonial-form', ['open' => false])->assertOk();
        $this->travel(1)->minutes();
        $this->actingAs($admin, 'sanctum')->putJson('/api/admin/home-content/testimonial-form', ['open' => true])->assertOk();
        $this->actingAs($user, 'sanctum')->getJson('/api/user/testimonial')->assertJsonPath('data.submitted', false);
    }

    public function test_photo_is_required(): void
    {
        Storage::fake('local');
        $user = $this->verifiedUser(['name' => 'Peserta', 'email' => 'user-testi2@example.test', 'password' => 'secret-password']);
        \App\Support\TestimonialForm::set(true);
        $this->actingAs($user, 'sanctum')->postJson('/api/user/testimonial', ['nama' => 'A', 'angkatan' => 'B', 'quote' => str_repeat('x', 30)])
            ->assertStatus(422)->assertJsonValidationErrors('photo');
    }
}
