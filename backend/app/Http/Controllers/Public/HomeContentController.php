<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HomeContentController extends Controller
{
    public static function imageUrl(?string $path): ?string
    {
        if (!$path) return null;
        if (preg_match('~^https?://~i', $path)) return $path;
        $parts = explode('/', $path);
        return count($parts) === 3 && $parts[0] === 'landing'
            ? route('public.home-image', ['kind' => $parts[1], 'filename' => $parts[2]])
            : null;
    }

    public function index()
    {
        $content = DB::table('site_contents')->orderBy('id')->first();
        if (!$content) return response()->json(['data' => ['hero_tagline' => null, 'hero_subtitle' => null, 'about' => null, 'visi' => null, 'misi' => [], 'gallery_managed' => false, 'testimonials_managed' => false, 'gallery' => [], 'testimonials' => []]]);

        $gallery = DB::table('galleries')->where('site_content_id', $content->id)->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn ($item) => ['id' => $item->id, 'image_url' => self::imageUrl($item->image), 'alt' => $item->alt, 'sort_order' => $item->sort_order]);
        $testimonials = DB::table('testimonials')->where('site_content_id', $content->id)->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn ($item) => ['id' => $item->id, 'nama' => $item->nama, 'angkatan' => $item->angkatan, 'quote' => $item->quote, 'foto_url' => self::imageUrl($item->foto), 'sort_order' => $item->sort_order]);

        return response()->json(['data' => ['hero_tagline' => $content->hero_tagline, 'hero_subtitle' => $content->hero_subtitle, 'about' => $content->about, 'visi' => $content->visi, 'misi' => json_decode($content->misi ?? '[]', true) ?: [], 'gallery_managed' => (bool) $content->gallery_managed || $gallery->isNotEmpty(), 'testimonials_managed' => (bool) $content->testimonials_managed || $testimonials->isNotEmpty(), 'gallery' => $gallery, 'testimonials' => $testimonials]]);
    }

    public function image(string $kind, string $filename)
    {
        abort_unless(in_array($kind, ['gallery', 'testimonials', 'albums'], true) && preg_match('~^[A-Za-z0-9_-]+\.(?:jpe?g|png|webp)$~i', $filename), 404);
        $path = "landing/{$kind}/{$filename}";
        abort_unless(Storage::disk('public')->exists($path), 404);
        return Storage::disk('public')->response($path, null, ['Cache-Control' => 'public, max-age=86400']);
    }
}
