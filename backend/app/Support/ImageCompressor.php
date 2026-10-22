<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageCompressor
{
    /**
     * Images shown on the public site are often several MB straight from a phone.
     * Re-encode to WebP no wider than $maxWidth on the public disk. Returns null
     * (caller keeps the original) when GD cannot handle the file or gains nothing.
     */
    public static function store(UploadedFile $file, string $dir, int $maxWidth = 1400): ?string
    {
        if (!function_exists('imagewebp') || !($source = @imagecreatefromstring((string) file_get_contents($file->getRealPath())))) return null;
        $width = imagesx($source);
        $height = imagesy($source);
        $scale = min(1, $maxWidth / max(1, $width));
        $image = $source;
        if ($scale < 1) {
            $image = imagecreatetruecolor((int) round($width * $scale), (int) round($height * $scale));
            imagealphablending($image, false);
            imagesavealpha($image, true);
            imagecopyresampled($image, $source, 0, 0, 0, 0, imagesx($image), imagesy($image), $width, $height);
            imagedestroy($source);
        }
        ob_start();
        $ok = imagewebp($image, null, 82);
        $data = ob_get_clean();
        imagedestroy($image);
        if (!$ok || !$data || strlen($data) >= $file->getSize()) return null;
        $path = $dir.'/'.Str::random(40).'.webp';
        return Storage::disk('public')->put($path, $data) ? $path : null;
    }
}
