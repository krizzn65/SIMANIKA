<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Support\OprecRegistrantDocument;
use Illuminate\Http\Request;

class OprecRegistrantExportController extends Controller
{
    public function __invoke(Request $request, Oprec $oprec, string $format)
    {
        abort_unless(in_array($request->user()->effectiveRole(), ['super_admin', 'admin', 'leader'], true), 403);
        abort_unless(in_array($format, ['xlsx', 'pdf'], true), 404);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'division' => ['nullable', 'integer', 'min:1'],
        ]);
        $query = $oprec->registrations()->with('user:id,email,name');
        $search = trim($filters['search'] ?? '');
        if ($search !== '') {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower($search));
            $pattern = "%{$escaped}%";
            $query->where(function ($query) use ($pattern) {
                $query->whereRaw("LOWER(nim) LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'nama') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'nama_lengkap') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereRaw("LOWER(form_data->>'namaLengkap') LIKE ? ESCAPE '\\'", [$pattern])
                    ->orWhereHas('user', fn ($user) => $user->whereRaw("LOWER(name) LIKE ? ESCAPE '\\'", [$pattern])
                        ->orWhereRaw("LOWER(email) LIKE ? ESCAPE '\\'", [$pattern]));
            });
        }
        if (isset($filters['division'])) {
            $id = (int) $filters['division'];
            $query->where(fn ($query) => $query->where('divisi_pilihan_1', $id)
                ->orWhere('divisi_pilihan_2', $id)->orWhere('divisi_pilihan_3', $id));
        }
        $document = new OprecRegistrantDocument($oprec->load('divisions'), $query->orderBy('id')->get());
        $bytes = $format === 'xlsx' ? $document->xlsx() : $document->pdf();
        $name = 'calon-peserta-oprec-'.$oprec->id.'.'.$format;
        return response($bytes, 200, [
            'Content-Type' => $format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$name.'"',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
