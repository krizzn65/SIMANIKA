<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Support\ImageCompressor;
use App\Support\TestimonialInvite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Dashboard testimonial card: only for accounts that opened the admin's shared link.
class UserTestimonialController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $invite = TestimonialInvite::active();
        $member = TestimonialInvite::usable($invite) ? TestimonialInvite::membership($invite, $request->user()->getKey()) : null;
        return response()->json(['data' => ['open' => (bool) $member, 'submitted' => (bool) $member?->submitted_at]]);
    }

    public function claim(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:64']]);
        $userId = $request->user()->getKey();

        return DB::transaction(function () use ($data, $userId) {
            $invite = DB::table('testimonial_invites')->where('token', $data['token'])->lockForUpdate()->first();
            abort_unless(TestimonialInvite::usable($invite), 410, 'Link testimoni sudah tidak berlaku.');
            if (!TestimonialInvite::membership($invite, $userId)) {
                abort_if($invite->quota !== null && TestimonialInvite::joinedCount($invite) >= $invite->quota, 410, 'Kuota link testimoni sudah penuh.');
                DB::table('testimonial_invite_users')->insert([
                    'testimonial_invite_id' => $invite->id, 'user_id' => $userId, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
            return response()->json(['data' => ['open' => true]]);
        });
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()->getKey();
        $invite = TestimonialInvite::active();
        $member = TestimonialInvite::usable($invite) ? TestimonialInvite::membership($invite, $userId) : null;
        abort_unless($member, 403, 'Buka link testimoni dari pengurus terlebih dahulu.');
        abort_if($member->submitted_at, 409, 'Kamu sudah mengirim testimoni.');

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
            DB::transaction(function () use ($data, $userId, $member, $photo) {
                // Claimed atomically so a double submit cannot create two rows.
                $claimed = DB::table('testimonial_invite_users')->where('id', $member->id)->whereNull('submitted_at')
                    ->update(['submitted_at' => now(), 'updated_at' => now()]);
                abort_unless($claimed, 409, 'Kamu sudah mengirim testimoni.');
                DB::table('testimonials')->insert([
                    'site_content_id' => TestimonialInvite::contentId(),
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
            });
        } catch (\Throwable $error) {
            Storage::disk('public')->delete($photo);
            throw $error;
        }

        return response()->json(['message' => 'Terima kasih! Testimonimu sudah kami terima.'], 201);
    }
}
