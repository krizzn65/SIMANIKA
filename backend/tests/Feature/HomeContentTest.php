<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HomeContentTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role, string $email): User
    {
        $user = User::create(['name' => $role, 'email' => $email, 'password' => 'password-testing-123']);
        $user->forceFill(['role' => $role])->save();
        return $user;
    }

    public function test_only_super_admin_and_admin_can_manage_landing_content(): void
    {
        config()->set('admin.email', 'official@example.test');
        $this->getJson('/api/public/home')->assertOk()->assertJsonPath('data.gallery_managed', false);
        $this->getJson('/api/admin/home-content')->assertUnauthorized();
        foreach (['leader', 'kwu', 'user'] as $role) {
            $this->actingAs($this->account($role, "$role@example.test"), 'sanctum')
                ->postJson('/api/admin/home-content/testimonials', ['nama' => 'Tidak boleh', 'quote' => 'Teks'])->assertForbidden();
        }
        $this->actingAs($this->account('admin', 'admin@example.test'), 'sanctum')
            ->getJson('/api/admin/home-content')->assertOk();
        $this->actingAs($this->account('super_admin', 'official@example.test'), 'sanctum')
            ->getJson('/api/admin/home-content')->assertOk();
    }

    public function test_gallery_and_testimonials_are_managed_and_public_after_crud(): void
    {
        Storage::fake('public');
        $this->actingAs($this->account('admin', 'admin@example.test'), 'sanctum');

        $this->post('/api/admin/home-content/gallery', ['image' => UploadedFile::fake()->image('kegiatan.jpg'), 'alt' => 'Kegiatan anggota', 'sort_order' => 2])
            ->assertCreated();
        $gallery = $this->getJson('/api/public/home')->assertOk()
            ->assertJsonPath('data.gallery_managed', true)
            ->assertJsonPath('data.testimonials_managed', false)
            ->assertJsonPath('data.gallery.0.alt', 'Kegiatan anggota')->json('data.gallery.0');
        $this->get($gallery['image_url'])->assertOk();

        $this->post("/api/admin/home-content/gallery/{$gallery['id']}", ['alt' => 'Kegiatan baru', 'sort_order' => 1])->assertOk();
        $this->postJson('/api/admin/home-content/testimonials', ['nama' => 'Alumni', 'angkatan' => '2024', 'quote' => 'Pengalaman baik', 'sort_order' => 1])->assertCreated();
        $testimonial = $this->getJson('/api/public/home')->assertJsonPath('data.gallery.0.alt', 'Kegiatan baru')
            ->assertJsonPath('data.testimonials_managed', true)->assertJsonPath('data.testimonials.0.quote', 'Pengalaman baik')->json('data.testimonials.0');
        $this->postJson("/api/admin/home-content/testimonials/{$testimonial['id']}", ['nama' => 'Alumni', 'angkatan' => '2024', 'quote' => 'Pengalaman diperbarui'])->assertOk();
        $this->getJson('/api/public/home')->assertJsonPath('data.testimonials.0.quote', 'Pengalaman diperbarui');

        $this->deleteJson("/api/admin/home-content/gallery/{$gallery['id']}")->assertNoContent();
        $this->deleteJson("/api/admin/home-content/testimonials/{$testimonial['id']}")->assertNoContent();
        $this->getJson('/api/public/home')->assertJsonPath('data.gallery_managed', true)
            ->assertJsonPath('data.testimonials_managed', true)
            ->assertJsonCount(0, 'data.gallery')->assertJsonCount(0, 'data.testimonials');
    }

    public function test_admin_can_upload_batch_gallery_photos(): void
    {
        Storage::fake('public');
        $this->actingAs($this->account('admin', 'admin@example.test'), 'sanctum');

        $payload = [
            'images' => [
                UploadedFile::fake()->image('foto1.jpg'),
                UploadedFile::fake()->image('foto2.png'),
            ],
            'alts' => ['Foto Kegiatan 1', 'Foto Kegiatan 2'],
            'sort_orders' => [10, 11],
        ];

        $response = $this->post('/api/admin/home-content/gallery/batch', $payload);
        $response->assertCreated()->assertJsonCount(2, 'data');

        $this->getJson('/api/public/home')
            ->assertOk()
            ->assertJsonCount(2, 'data.gallery')
            ->assertJsonPath('data.gallery.0.alt', 'Foto Kegiatan 1')
            ->assertJsonPath('data.gallery.1.alt', 'Foto Kegiatan 2');
    }

    public function test_invalid_images_and_long_testimonials_are_rejected(): void
    {
        Storage::fake('public');
        $this->actingAs($this->account('admin', 'admin@example.test'), 'sanctum');
        $this->post('/api/admin/home-content/gallery', ['image' => UploadedFile::fake()->create('document.pdf'), 'alt' => 'Dokumen'], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->postJson('/api/admin/home-content/testimonials', ['nama' => 'Alumni', 'quote' => str_repeat('x', 1501)])->assertUnprocessable();
    }

    public function test_admin_can_update_landing_text_and_public_can_read_it(): void
    {
        $this->actingAs($this->account('admin', 'admin@example.test'), 'sanctum');
        $text = [
            'hero_tagline' => 'Portal HIMANIKA',
            'hero_subtitle' => 'Bergerak bersama.',
            'about' => 'Tentang kami.',
            'visi' => 'Visi organisasi.',
            'misi' => ['Misi satu', 'Misi dua', 'Misi tiga', 'Misi empat'],
        ];
        $this->putJson('/api/admin/home-content/text', $text)->assertOk();
        $this->getJson('/api/public/home')->assertJsonPath('data.hero_tagline', 'Portal HIMANIKA')
            ->assertJsonPath('data.misi.3', 'Misi empat');
        $this->putJson('/api/admin/home-content/text', array_merge($text, ['misi' => ['Tidak lengkap']]))->assertUnprocessable();
    }
}
