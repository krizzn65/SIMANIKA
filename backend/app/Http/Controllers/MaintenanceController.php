<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Site-wide maintenance switch for the static frontend. Kept in a small file so
// no migration is needed; the API itself stays up so staff can switch it off.
class MaintenanceController extends Controller
{
    private const FILE = 'maintenance.json';

    public static function current(): array
    {
        $disk = Storage::disk('local');
        $stored = $disk->exists(self::FILE) ? json_decode((string) $disk->get(self::FILE), true) : null;
        return [
            'maintenance' => (bool) ($stored['maintenance'] ?? false),
            'message' => $stored['message'] ?? null,
            'updated_at' => $stored['updated_at'] ?? null,
        ];
    }

    public function show(): JsonResponse
    {
        return response()->json(['data' => self::current()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'maintenance' => ['required', 'boolean'],
            'message' => ['nullable', 'string', 'max:300'],
        ]);
        $state = [
            'maintenance' => $data['maintenance'],
            'message' => filled($data['message'] ?? null) ? trim($data['message']) : null,
            'updated_at' => now()->toIso8601String(),
        ];
        Storage::disk('local')->put(self::FILE, json_encode($state));
        return response()->json(['data' => $state]);
    }
}
