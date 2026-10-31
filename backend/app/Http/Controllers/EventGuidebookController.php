<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventGuidebookController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate(['guidebook' => ['required', 'file', 'mimes:pdf', 'max:8192']]);

        $path = $request->file('guidebook')->store('events/guidebooks', 'public');

        return response()->json([
            'data' => [
                'path' => $path,
                'url' => route('public.event-guidebook', ['filename' => basename($path)]),
            ],
        ], 201);
    }

    public function download(string $filename)
    {
        abort_unless(preg_match('/^[A-Za-z0-9_-]+\.pdf$/', $filename), 404);
        $path = 'events/guidebooks/'.$filename;
        abort_unless(Storage::disk('public')->exists($path), 404);

        return Storage::disk('public')->response($path, 'Guidebook.pdf', [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'public, max-age=86400',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
