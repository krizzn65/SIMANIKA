<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Public\HomeContentController as PublicHomeContentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HomeContentController extends Controller
{
    public function index(PublicHomeContentController $public)
    {
        $response = $public->index();
        $data = $response->getData(true);
        $contentId = $this->contentId();

        $allTestimonials = DB::table('testimonials')
            ->leftJoin('users', 'testimonials.user_id', '=', 'users.id')
            ->where('testimonials.site_content_id', $contentId)
            ->orderBy('testimonials.sort_order')
            ->orderByDesc('testimonials.id')
            ->select([
                'testimonials.*',
                'users.email as user_email',
                'users.name as user_account_name',
            ])
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'user_id' => $item->user_id,
                'nama' => $item->nama,
                'angkatan' => $item->angkatan,
                'quote' => $item->quote,
                'foto_url' => PublicHomeContentController::imageUrl($item->foto),
                'sort_order' => $item->sort_order,
                'status' => $item->status ?? 'approved',
                'is_visible' => (bool) ($item->is_visible ?? true),
                'user_email' => $item->user_email,
                'user_account_name' => $item->user_account_name,
                'created_at' => $item->created_at,
            ]);

        $data['data']['testimonials'] = $allTestimonials;
        return response()->json($data);
    }

    private function contentId(): int
    {
        $id = DB::table('site_contents')->orderBy('id')->value('id');
        if ($id) return $id;
        return DB::table('site_contents')->insertGetId(['created_at' => now(), 'updated_at' => now()]);
    }

    private function imageRule(bool $required): array
    {
        return [$required ? 'required' : 'nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120', 'dimensions:max_width=4000,max_height=4000'];
    }

    public function updateText(Request $request)
    {
        $data = $request->validate([
            'hero_tagline' => ['required', 'string', 'max:255'],
            'hero_subtitle' => ['required', 'string', 'max:1000'],
            'about' => ['required', 'string', 'max:5000'],
            'visi' => ['required', 'string', 'max:1500'],
            'misi' => ['required', 'array', 'size:4'],
            'misi.*' => ['required', 'string', 'max:1000'],
        ]);
        $contentId = $this->contentId();
        DB::table('site_contents')->where('id', $contentId)->update([
            'hero_tagline' => trim($data['hero_tagline']),
            'hero_subtitle' => trim($data['hero_subtitle']),
            'about' => trim($data['about']),
            'visi' => trim($data['visi']),
            'misi' => json_encode(array_map('trim', $data['misi']), JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['message' => 'Teks landing page berhasil disimpan.']);
    }

    public function storeBatchGallery(Request $request)
    {
        $request->validate([
            'images' => ['required', 'array', 'min:1', 'max:50'],
            'images.*' => $this->imageRule(true),
            'alts' => ['nullable', 'array'],
            'sort_orders' => ['nullable', 'array'],
        ]);

        $images = $request->file('images');
        $alts = $request->input('alts', []);
        $sortOrders = $request->input('sort_orders', []);

        $created = DB::transaction(function () use ($images, $alts, $sortOrders) {
            $contentId = $this->contentId();
            $stored = [];
            foreach ($images as $index => $file) {
                $path = $file->store('landing/gallery', 'public');
                $alt = !empty($alts[$index]) ? trim($alts[$index]) : pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $sortOrder = isset($sortOrders[$index]) ? (int) $sortOrders[$index] : 0;
                $id = DB::table('galleries')->insertGetId([
                    'site_content_id' => $contentId,
                    'image' => $path,
                    'alt' => $alt,
                    'sort_order' => $sortOrder,
                ]);
                $stored[] = ['id' => $id, 'image_url' => PublicHomeContentController::imageUrl($path), 'alt' => $alt, 'sort_order' => $sortOrder];
            }
            DB::table('site_contents')->where('id', $contentId)->update(['gallery_managed' => true, 'updated_at' => now()]);
            return $stored;
        });

        return response()->json(['data' => $created, 'message' => count($created) . ' foto galeri berhasil ditambahkan.'], 201);
    }

    public function storeGallery(Request $request)
    {
        $data = $request->validate(['image' => $this->imageRule(true), 'alt' => ['required', 'string', 'max:200'], 'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999']]);
        $path = $request->file('image')->store('landing/gallery', 'public');
        try {
            $id = DB::transaction(function () use ($path, $data) {
                $contentId = $this->contentId();
                $id = DB::table('galleries')->insertGetId(['site_content_id' => $contentId, 'image' => $path, 'alt' => trim($data['alt']), 'sort_order' => $data['sort_order'] ?? 0]);
                DB::table('site_contents')->where('id', $contentId)->update(['gallery_managed' => true, 'updated_at' => now()]);
                return $id;
            });
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($path);
            throw $error;
        }
        return response()->json(['data' => ['id' => $id, 'image_url' => PublicHomeContentController::imageUrl($path)]], 201);
    }

    public function updateGallery(Request $request, int $id)
    {
        $data = $request->validate(['image' => $this->imageRule(false), 'alt' => ['required', 'string', 'max:200'], 'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999']]);
        $item = DB::table('galleries')->where('id', $id)->first();
        abort_unless($item, 404);
        $path = $request->hasFile('image') ? $request->file('image')->store('landing/gallery', 'public') : $item->image;
        try {
            DB::table('galleries')->where('id', $id)->update(['image' => $path, 'alt' => trim($data['alt']), 'sort_order' => $data['sort_order'] ?? $item->sort_order]);
        } catch (\Throwable $error) {
            if ($path !== $item->image) Storage::disk('public')->delete($path);
            throw $error;
        }
        if ($path !== $item->image) Storage::disk('public')->delete($item->image);
        return response()->json(['data' => ['id' => $id, 'image_url' => PublicHomeContentController::imageUrl($path)]]);
    }

    public function destroyGallery(int $id)
    {
        $item = DB::table('galleries')->where('id', $id)->first();
        abort_unless($item, 404);
        DB::table('galleries')->where('id', $id)->delete();
        DB::table('site_contents')->where('id', $item->site_content_id)->update(['gallery_managed' => true, 'updated_at' => now()]);
        Storage::disk('public')->delete($item->image);
        return response()->noContent();
    }

    public function storeTestimonial(Request $request)
    {
        $data = $request->validate($this->testimonialRules());
        $path = $request->hasFile('photo') ? $request->file('photo')->store('landing/testimonials', 'public') : ($data['photo_url'] ?? null);
        try {
            $id = DB::transaction(function () use ($data, $path) {
                $contentId = $this->contentId();
                $id = DB::table('testimonials')->insertGetId([
                    'site_content_id' => $contentId,
                    'user_id' => null,
                    'nama' => trim($data['nama']),
                    'angkatan' => $data['angkatan'] ?? null,
                    'quote' => trim($data['quote']),
                    'foto' => $path,
                    'sort_order' => $data['sort_order'] ?? 0,
                    'status' => $data['status'] ?? 'approved',
                    'is_visible' => isset($data['is_visible']) ? (bool) $data['is_visible'] : true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('site_contents')->where('id', $contentId)->update(['testimonials_managed' => true, 'updated_at' => now()]);
                return $id;
            });
        } catch (\Throwable $error) {
            if ($request->hasFile('photo')) Storage::disk('public')->delete($path);
            throw $error;
        }
        return response()->json(['data' => ['id' => $id]], 201);
    }

    public function updateTestimonial(Request $request, int $id)
    {
        $data = $request->validate($this->testimonialRules());
        $item = DB::table('testimonials')->where('id', $id)->first();
        abort_unless($item, 404);
        $path = $request->hasFile('photo') ? $request->file('photo')->store('landing/testimonials', 'public') : ($data['photo_url'] ?? $item->foto);
        if ($path === PublicHomeContentController::imageUrl($item->foto)) $path = $item->foto;
        try {
            DB::table('testimonials')->where('id', $id)->update([
                'nama' => trim($data['nama']),
                'angkatan' => $data['angkatan'] ?? null,
                'quote' => trim($data['quote']),
                'foto' => $path,
                'sort_order' => $data['sort_order'] ?? $item->sort_order,
                'status' => $data['status'] ?? $item->status,
                'is_visible' => isset($data['is_visible']) ? (bool) $data['is_visible'] : (bool) $item->is_visible,
                'updated_at' => now(),
            ]);
        } catch (\Throwable $error) {
            if ($request->hasFile('photo')) Storage::disk('public')->delete($path);
            throw $error;
        }
        if ($item->foto && $path !== $item->foto && str_starts_with($item->foto, 'landing/testimonials/')) Storage::disk('public')->delete($item->foto);
        return response()->json(['data' => ['id' => $id]]);
    }

    public function toggleTestimonialVisibility(int $id)
    {
        $item = DB::table('testimonials')->where('id', $id)->first();
        abort_unless($item, 404);
        $newVisible = !((bool) $item->is_visible);
        DB::table('testimonials')->where('id', $id)->update([
            'is_visible' => $newVisible,
            'status' => 'approved',
            'updated_at' => now(),
        ]);
        return response()->json([
            'message' => $newVisible ? 'Testimoni sekarang ditampilkan ke publik.' : 'Testimoni disembunyikan dari publik.',
            'data' => ['id' => $id, 'is_visible' => $newVisible],
        ]);
    }

    public function updateTestimonialStatus(Request $request, int $id)
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'in:approved,pending,rejected'],
            'is_visible' => ['nullable', 'boolean'],
        ]);
        $item = DB::table('testimonials')->where('id', $id)->first();
        abort_unless($item, 404);

        $updates = [
            'status' => $data['status'],
            'updated_at' => now(),
        ];
        if (isset($data['is_visible'])) {
            $updates['is_visible'] = (bool) $data['is_visible'];
        } elseif ($data['status'] === 'approved') {
            $updates['is_visible'] = true;
        } elseif ($data['status'] === 'rejected') {
            $updates['is_visible'] = false;
        }

        DB::table('testimonials')->where('id', $id)->update($updates);

        return response()->json([
            'message' => 'Status testimoni berhasil diperbarui.',
            'data' => ['id' => $id, 'status' => $data['status'], 'is_visible' => $updates['is_visible'] ?? (bool) $item->is_visible],
        ]);
    }

    public function destroyTestimonial(int $id)
    {
        $item = DB::table('testimonials')->where('id', $id)->first();
        abort_unless($item, 404);
        DB::table('testimonials')->where('id', $id)->delete();
        DB::table('site_contents')->where('id', $item->site_content_id)->update(['testimonials_managed' => true, 'updated_at' => now()]);
        if ($item->foto && str_starts_with($item->foto, 'landing/testimonials/')) Storage::disk('public')->delete($item->foto);
        return response()->noContent();
    }

    private function testimonialRules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:120'],
            'angkatan' => ['nullable', 'string', 'max:160'],
            'quote' => ['required', 'string', 'max:1500'],
            'photo' => $this->imageRule(false),
            'photo_url' => ['nullable', 'url:http,https', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'status' => ['nullable', 'string', 'in:approved,pending,rejected'],
            'is_visible' => ['nullable', 'boolean'],
        ];
    }
}
