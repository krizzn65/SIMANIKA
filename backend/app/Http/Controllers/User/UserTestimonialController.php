<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Public\HomeContentController as PublicHomeContentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UserTestimonialController extends Controller
{
    private function contentId(): int
    {
        $id = DB::table('site_contents')->orderBy('id')->value('id');
        if ($id) return $id;
        return DB::table('site_contents')->insertGetId(['created_at' => now(), 'updated_at' => now()]);
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $items = DB::table('testimonials')
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'nama' => $item->nama,
                'angkatan' => $item->angkatan,
                'quote' => $item->quote,
                'foto_url' => PublicHomeContentController::imageUrl($item->foto),
                'status' => $item->status ?? 'pending',
                'is_visible' => (bool) ($item->is_visible ?? false),
                'created_at' => $item->created_at,
            ]);

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'quote' => ['required', 'string', 'min:10', 'max:1500'],
            'angkatan' => ['nullable', 'string', 'max:120'],
            'photo' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ], [
            'quote.required' => 'Pesan testimoni wajib diisi.',
            'quote.min' => 'Pesan testimoni minimal 10 karakter.',
            'quote.max' => 'Pesan testimoni maksimal 1500 karakter.',
        ]);

        $contentId = $this->contentId();

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('landing/testimonials', 'public');
        } elseif (!empty($user->foto_profil)) {
            $photoPath = $user->foto_profil;
        }

        $nextSortOrder = (DB::table('testimonials')->where('site_content_id', $contentId)->max('sort_order') ?? 0) + 1;

        $displayName = !empty($user->name) ? $user->name : (!empty($user->nama) ? $user->nama : explode('@', $user->email)[0]);

        $id = DB::table('testimonials')->insertGetId([
            'site_content_id' => $contentId,
            'user_id' => $user->id,
            'nama' => $displayName,
            'angkatan' => !empty($validated['angkatan']) ? trim($validated['angkatan']) : 'Mahasiswa HIMANIKA',
            'quote' => trim($validated['quote']),
            'foto' => $photoPath,
            'sort_order' => $nextSortOrder,
            // Shown on the public landing page, so an admin approves it first.
            'status' => 'pending',
            'is_visible' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Testimoni terkirim dan sedang menunggu persetujuan admin.',
            'data' => [
                'id' => $id,
                'status' => 'pending',
                'is_visible' => false,
            ],
        ], 201);
    }
}
