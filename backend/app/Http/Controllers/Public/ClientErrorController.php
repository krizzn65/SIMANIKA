<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\AuditTrail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// Requests that never reached the server cannot be logged by it. The browser keeps
// a note of them and sends it here once the connection works again.
class ClientErrorController extends Controller
{
    public function store(Request $request, AuditTrail $audit): JsonResponse
    {
        $data = $request->validate([
            'reports' => ['required', 'array', 'max:20'],
            'reports.*.at' => ['required', 'date'],
            'reports.*.page' => ['nullable', 'string', 'max:200'],
            'reports.*.endpoint' => ['nullable', 'string', 'max:200'],
            'reports.*.method' => ['nullable', 'string', 'in:GET,POST,PUT,PATCH,DELETE'],
            'reports.*.error' => ['nullable', 'string', 'max:60'],
            'reports.*.online' => ['nullable', 'boolean'],
        ]);

        foreach ($data['reports'] as $report) {
            $audit->recordCustom($request, 'system', 'system.client_network', 'error', 'failed',
                'Koneksi gagal dari sisi pengguna', 0, context: [
                    'error_description' => 'Permintaan dari browser pengguna tidak mendapat jawaban (koneksi diputus sebelum sampai ke server, misalnya oleh jaringan/Wi-Fi atau firewall hosting).',
                    'occurred_at' => $report['at'],
                    'page' => $report['page'] ?? null,
                    'endpoint' => $report['endpoint'] ?? null,
                    'method' => $report['method'] ?? null,
                    'error_type' => $report['error'] ?? null,
                    'browser_online' => $report['online'] ?? null,
                ]);
        }

        return response()->json(['data' => ['recorded' => count($data['reports'])]], 201);
    }
}
