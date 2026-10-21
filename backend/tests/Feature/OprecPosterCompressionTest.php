<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OprecPosterCompressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_large_poster_is_resized_to_webp_and_served_with_long_cache(): void
    {
        Storage::fake('public');
        $admin = $this->verifiedUser(['name' => 'Admin', 'email' => 'admin-poster@example.test', 'password' => 'secret-password']);
        $admin->forceFill(['role' => 'admin'])->save();

        $image = imagecreatetruecolor(3000, 4000);
        for ($i = 0; $i < 4000; $i += 7) imageline($image, 0, $i, 3000, 4000 - $i, imagecolorallocate($image, $i % 255, (int) ($i / 3) % 255, 120));
        $png = tempnam(sys_get_temp_dir(), 'poster').'.png';
        imagepng($image, $png);
        $upload = new UploadedFile($png, 'poster.png', 'image/png', null, true);

        $url = $this->actingAs($admin, 'sanctum')->post('/api/admin/oprec/upload-poster', ['poster' => $upload], ['Accept' => 'application/json'])
            ->assertOk()->json('url');

        $this->assertStringEndsWith('.webp', $url);
        $stored = Storage::disk('public')->files('oprec/posters');
        $this->assertCount(1, $stored);
        [$width] = getimagesizefromstring(Storage::disk('public')->get($stored[0]));
        $this->assertSame(1400, $width);
        $this->assertLessThan(filesize($png), Storage::disk('public')->size($stored[0]));

        $this->get(parse_url($url, PHP_URL_PATH))->assertOk()->assertHeader('Cache-Control', 'immutable, max-age=31536000, public');
    }
}
