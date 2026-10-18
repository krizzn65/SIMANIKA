<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecPosterUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_and_serve_oprec_poster(): void
    {
        Storage::fake('public');
        config()->set('admin.email', 'poster-admin@example.test');
        $admin = $this->verifiedUser(['email' => 'poster-admin@example.test', 'password' => 'password-testing-123']);
        $admin->forceFill(['role' => 'super_admin'])->save();
        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
        );
        $poster = UploadedFile::fake()->createWithContent('poster.png', $png.str_repeat(' ', 3 * 1024 * 1024));

        $response = $this->actingAs($admin, 'sanctum')->post('/api/admin/oprec/upload-poster', ['poster' => $poster]);
        $response->assertOk()->assertJsonStructure(['url']);
        $filename = basename(parse_url($response->json('url'), PHP_URL_PATH));
        Storage::disk('public')->assertExists('oprec/posters/'.$filename);
        $this->get('/api/public/oprec/posters/'.$filename)->assertOk();

        $tooLarge = UploadedFile::fake()->createWithContent('too-large.png', $png.str_repeat(' ', 5 * 1024 * 1024));
        $this->post('/api/admin/oprec/upload-poster', ['poster' => $tooLarge])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('poster');
    }
}
