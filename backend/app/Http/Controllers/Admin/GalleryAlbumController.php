<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Public\GalleryAlbumController as PublicGalleryAlbumController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GalleryAlbumController extends Controller
{
    private function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'event_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:2000'],
            // Only Google Drive links are accepted for the documentation button.
            'drive_url' => ['nullable', 'url:https', 'max:500', 'regex:~^https://(drive|docs)\.google\.com/~i'],
        ];
    }

    private function photoRule(): array
    {
        return ['file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120', 'dimensions:max_width=4000,max_height=4000'];
    }

    private function fields(array $data): array
    {
        return [
            'title' => trim($data['title']),
            'event_date' => $data['event_date'] ?? null,
            'description' => isset($data['description']) ? trim($data['description']) ?: null : null,
            'drive_url' => isset($data['drive_url']) ? trim($data['drive_url']) ?: null : null,
        ];
    }

    public function index(PublicGalleryAlbumController $public)
    {
        return $public->index();
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $id = DB::transaction(function () use ($data) {
            $id = DB::table('gallery_albums')->insertGetId($this->fields($data) + ['slug' => Str::uuid(), 'created_at' => now(), 'updated_at' => now()]);
            DB::table('gallery_albums')->where('id', $id)->update(['slug' => (Str::limit(Str::slug($data['title']), 170, '') ?: 'album') . '-' . $id]);
            return $id;
        });
        return response()->json(['data' => ['id' => $id], 'message' => 'Album berhasil dibuat.'], 201);
    }

    public function update(Request $request, int $id)
    {
        $data = $request->validate($this->rules());
        abort_unless(DB::table('gallery_albums')->where('id', $id)->exists(), 404);
        DB::table('gallery_albums')->where('id', $id)->update($this->fields($data) + ['updated_at' => now()]);
        return response()->json(['message' => 'Album berhasil disimpan.']);
    }

    public function destroy(int $id)
    {
        abort_unless(DB::table('gallery_albums')->where('id', $id)->exists(), 404);
        $paths = DB::table('gallery_album_photos')->where('gallery_album_id', $id)->pluck('image')->all();
        DB::table('gallery_albums')->where('id', $id)->delete();
        Storage::disk('public')->delete($paths);
        return response()->json(['message' => 'Album berhasil dihapus.']);
    }

    public function storePhotos(Request $request, int $id)
    {
        abort_unless(DB::table('gallery_albums')->where('id', $id)->exists(), 404);
        $request->validate(['photos' => ['required', 'array', 'min:1', 'max:50'], 'photos.*' => $this->photoRule()]);
        $paths = [];
        try {
            DB::transaction(function () use ($request, $id, &$paths) {
                $order = (int) DB::table('gallery_album_photos')->where('gallery_album_id', $id)->max('sort_order');
                foreach ($request->file('photos') as $file) {
                    $path = $file->store('landing/albums', 'public');
                    $paths[] = $path;
                    DB::table('gallery_album_photos')->insert([
                        'gallery_album_id' => $id, 'image' => $path,
                        'alt' => Str::limit(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME), 200, ''),
                        'sort_order' => ++$order,
                    ]);
                }
                DB::table('gallery_albums')->where('id', $id)->update(['updated_at' => now()]);
            });
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($paths);
            throw $error;
        }
        return response()->json(['data' => PublicGalleryAlbumController::photos($id), 'message' => count($paths) . ' foto berhasil ditambahkan.'], 201);
    }

    public function destroyPhoto(int $id, int $photo)
    {
        $item = DB::table('gallery_album_photos')->where('gallery_album_id', $id)->where('id', $photo)->first();
        abort_unless($item, 404);
        DB::table('gallery_album_photos')->where('id', $photo)->delete();
        Storage::disk('public')->delete($item->image);
        return response()->json(['message' => 'Foto berhasil dihapus.']);
    }
}
