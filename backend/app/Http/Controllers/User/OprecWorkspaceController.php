<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Oprec;
use App\Models\OprecRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OprecWorkspaceController extends Controller
{
    public function show(Request $request)
    {
        $userId = $request->user()->getKey();
        $requested = $request->validate(['oprec_id' => ['nullable', 'integer', 'min:1']])['oprec_id'] ?? null;
        $oprec = $requested
            ? Oprec::with('divisions')->find($requested)
            : Oprec::with('divisions')->where('status', '!=', 'draft')
                ->latest('created_at')->latest('id')->first();

        abort_unless($oprec, 404, 'OPREC tidak ditemukan.');

        $registration = OprecRegistration::where('oprec_id', $oprec->id)
            ->where('user_id', $userId)
            ->first();

        $enrolled = DB::table('oprec_enrollments')
            ->where('oprec_id', $oprec->id)
            ->where('user_id', $userId)
            ->exists();

        if ($requested) abort_unless($registration || $enrolled, 404, 'Pendaftaran OPREC tidak ditemukan.');

        $announced = app(\App\Services\OprecAnnouncementService::class)->released($oprec);
        $writtenTestSubmitted = $registration && $oprec->writtenTest()
            ->whereHas('submissions', fn ($query) => $query->where('user_id', $userId))->exists();

        $acceptedDivision = null;
        if ($registration && $registration->accepted_division_id) {
            $acceptedDivision = $oprec->divisions->firstWhere('id', $registration->accepted_division_id)?->nama;
        }

        return response()->json([
            'data' => [
                'oprec' => [
                    'id' => $oprec->id,
                    'periode' => $oprec->periode,
                    'status' => $oprec->status,
                    'headline' => $oprec->headline,
                    'deskripsi' => $oprec->deskripsi,
                    'poster' => $oprec->poster ? url('api/public/oprec/posters/' . basename($oprec->poster)) : null,
                    'tanggalBuka' => $oprec->tanggal_buka?->toIso8601String(),
                    'tanggalTutup' => $oprec->tanggal_tutup?->toIso8601String(),
                    'schemaVersion' => $oprec->schema_version,
                    'link_grup_wa' => $registration ? $oprec->link_grup_wa : null,
                    'linkGrupWa' => $registration ? $oprec->link_grup_wa : null,
                    'formFields' => collect($oprec->form_fields ?? [])
                        ->reject(fn ($field) => in_array($field['name'] ?? '', ['divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3'], true))
                        ->map(fn ($field) => array_merge($field, [
                            'target_type' => $field['target_type'] ?? 'all',
                            'targetType' => $field['target_type'] ?? 'all',
                            'target_divisions' => $field['target_divisions'] ?? [],
                            'targetDivisions' => $field['target_divisions'] ?? [],
                        ]))
                        ->values()->all(),
                    'formIntro' => $oprec->form_intro ?? null,
                    'divisiTersedia' => $oprec->divisions->map(fn ($d) => [
                        'id' => (string) $d->id,
                        'nama' => $d->nama,
                        'namaLengkap' => $d->nama_lengkap,
                        'deskripsi' => $d->deskripsi,
                        'jabatan' => $d->jabatan ?? [],
                        'logo' => $d->logo,
                    ])->values()->all(),
                    'divisions' => $oprec->divisions->map(fn ($d) => [
                        'id' => $d->id,
                        'nama' => $d->nama,
                        'namaLengkap' => $d->nama_lengkap,
                        'deskripsi' => $d->deskripsi,
                        'jabatan' => $d->jabatan ?? [],
                        'logo' => $d->logo,
                    ])->values()->all(),
                    'pengumuman' => [
                        'published' => (bool) $oprec->pengumuman_published,
                        'tanggal' => $oprec->pengumuman_tanggal?->toIso8601String(),
                    ],
                ],
                'enrolled' => $enrolled,
                'writtenTestSubmitted' => (bool) $writtenTestSubmitted,
                'registration' => $registration ? [
                    'id' => $registration->id,
                    'nim' => $registration->nim,
                    'tanggalLahir' => $registration->tanggal_lahir?->format('Y-m-d'),
                    'divisiPilihan1' => $registration->divisi_pilihan_1,
                    'divisiPilihan2' => $registration->divisi_pilihan_2,
                    'divisiPilihan3' => $registration->divisi_pilihan_3,
                    'formData' => $registration->form_data,
                    'uploadedFileFields' => collect($oprec->form_fields ?? [])
                        ->filter(fn ($field) => ($field['type'] ?? null) === 'file'
                            && array_key_exists($field['name'] ?? '', $registration->file_uploads ?? []))
                        ->pluck('name')->values()->all(),
                    'link_grup_wa' => $oprec->link_grup_wa,
                    'linkGrupWa' => $oprec->link_grup_wa,
                    'status' => $announced ? $registration->status : 'pending',
                    'catatan' => $announced ? $registration->catatan : null,
                    'acceptedDivision' => $announced && $registration->status === 'accepted' ? $acceptedDivision : null,
                    'registeredAt' => $registration->created_at?->toIso8601String(),
                ] : null,
                'announced' => $announced,
            ],
        ]);
    }
}
