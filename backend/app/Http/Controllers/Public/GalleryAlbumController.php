<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class GalleryAlbumController extends Controller
{
    public static function photos(int $albumId)
    {
        return DB::table('gallery_album_photos')->where('gallery_album_id', $albumId)->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn ($photo) => ['id' => $photo->id, 'image_url' => HomeContentController::imageUrl($photo->image), 'alt' => $photo->alt, 'sort_order' => $photo->sort_order]);
    }

    public static function summary(object $album, $photos): array
    {
        return [
            'id' => $album->id, 'title' => $album->title, 'slug' => $album->slug, 'event_date' => $album->event_date,
            'description' => $album->description, 'drive_url' => $album->drive_url,
            'cover_url' => $photos->first()['image_url'] ?? null, 'photo_count' => $photos->count(),
        ];
    }

    public function index()
    {
        $albums = DB::table('gallery_albums')->orderByDesc('event_date')->orderByDesc('id')->get()
            ->map(fn ($album) => self::summary($album, self::photos($album->id)));
        return response()->json(['data' => $albums]);
    }

    public function show(string $slug)
    {
        $album = DB::table('gallery_albums')->where('slug', $slug)->first();
        abort_unless($album, 404);
        $photos = self::photos($album->id);
        return response()->json(['data' => self::summary($album, $photos) + ['photos' => $photos]]);
    }
}
