<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Support\ImageCompressor;
use App\Support\TestimonialForm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Dashboard testimonial card: only while an admin has the form open, once per opening.
class UserTestimonialController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $form = TestimonialForm::current();
        return response()->json(['data' => [
            'open' => $form['open'],
            'submitted' => $form['open'] && $this->submittedThisRound($request->user()->getKey(), $form),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $form = TestimonialForm::current();
        abort_unless($form['open'], 409, 'Pengisian testimoni sedang ditutup.');
        $userId = $request->user()->getKey();
        abort_if($this->submittedThisRound($userId, $form), 409, 'Kamu sudah mengirim testimoni.');

        $data = $request->validate([
            'nama' => ['required', 'string', 'max:120'],
            'angkatan' => ['required', 'string', 'max:120'],
            'quote' => ['required', 'string', 'min:20', 'max:600'],
            'photo' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ], [
            'photo.required' => 'Foto profil wajib diunggah.',
            'quote.min' => 'Testimoni minimal 20 karakter.',
        ]);

        $photo = ImageCompressor::store($request->file('photo'), 'landing/testimonials', 600)
            ?? $request->file('photo')->store('landing/testimonials', 'public');
        try {
            DB::table('testimonials')->insert([
                'site_content_id' => TestimonialForm::contentId(),
                'user_id' => $userId,
                'nama' => trim($data['nama']),
                'angkatan' => trim($data['angkatan']),
                'quote' => trim($data['quote']),
                'foto' => $photo,
                'sort_order' => 0,
                // Shown on the landing page, so an admin approves it first.
                'status' => 'pending',
                'is_visible' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($photo);
            throw $error;
        }

        return response()->json(['message' => 'Terima kasih! Testimonimu sudah kami terima.'], 201);
    }

    private function submittedThisRound(int $userId, array $form): bool
    {
        return DB::table('testimonials')->where('user_id', $userId)
            ->when($form['opened_at'], fn ($query, $openedAt) => $query->where('created_at', '>=', $openedAt))
            ->exists();
    }
}
