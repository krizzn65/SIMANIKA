<?php

namespace Database\Seeders;

use App\Models\Oprec;
use App\Models\OprecRegistration;
use App\Models\OprecTestSubmission;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class OprecDemoParticipantsSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            throw new RuntimeException('Data dummy OPREC hanya boleh dibuat di lingkungan local/testing.');
        }

        DB::transaction(function (): void {
            $oprec = Oprec::where('periode', '2026/2027')->firstOrFail();
            $stage = $oprec->writtenTest()->firstOrFail();
            $divisions = $oprec->divisions()->get();
            $questions = $stage->form_fields ?? [];

            if ($divisions->count() < 3 || count($questions) === 0) {
                throw new RuntimeException('Periode membutuhkan minimal tiga divisi dan satu soal Tes Tulis.');
            }
            if (collect($questions)->contains(fn ($question) => ($question['type'] ?? '') === 'file' && !empty($question['required']))) {
                throw new RuntimeException('Soal berkas wajib harus diisi melalui formulir peserta.');
            }

            for ($number = 1; $number <= 10; $number++) {
                $suffix = str_pad((string) $number, 2, '0', STR_PAD_LEFT);
                $email = "oprec.demo.{$suffix}@example.test";
                $name = "Peserta Uji OPREC {$suffix}";
                $nim = "E3126990{$suffix}";
                $chosen = [
                    $divisions[($number - 1) % $divisions->count()],
                    $divisions[$number % $divisions->count()],
                    $divisions[($number + 1) % $divisions->count()],
                ];

                $user = User::where('email', $email)->first();
                if ($user && ($user->role !== User::ROLE_USER || $user->name !== $name)) {
                    throw new RuntimeException("Email uji {$email} sudah digunakan akun lain.");
                }
                $user ??= User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Str::random(64),
                ]);

                $form = [
                    'nama' => $name,
                    'nim' => $nim,
                    'tanggal_lahir' => '2005-'.str_pad((string) (($number % 12) + 1), 2, '0', STR_PAD_LEFT).'-15',
                    'angkatan' => $number % 2 === 0 ? '2024' : '2025',
                    'divisi_pilihan_1' => (string) $chosen[0]->id,
                    'divisi_pilihan_2' => (string) $chosen[1]->id,
                    'divisi_pilihan_3' => (string) $chosen[2]->id,
                    'jabatan_pilihan_1' => $chosen[0]->jabatan[0] ?? 'Staff Divisi '.$chosen[0]->nama,
                    'jabatan_pilihan_2' => $chosen[1]->jabatan[0] ?? 'Staff Divisi '.$chosen[1]->nama,
                    'jabatan_pilihan_3' => $chosen[2]->jabatan[0] ?? 'Staff Divisi '.$chosen[2]->nama,
                ];
                foreach ($oprec->form_fields ?? [] as $field) {
                    $key = $field['name'] ?? null;
                    if (!$key || array_key_exists($key, $form) || ($field['type'] ?? '') === 'file') continue;
                    if (($field['target_type'] ?? 'all') === 'specific') {
                        $targets = array_map('strtolower', $field['target_divisions'] ?? []);
                        if (!collect($chosen)->contains(fn ($division) => in_array(strtolower($division->nama), $targets, true))) continue;
                    }
                    $form[$key] = $this->formValue($field, $number);
                }

                $registration = OprecRegistration::where('oprec_id', $oprec->id)->where('user_id', $user->id)->first();
                if ($registration && $registration->nim !== $nim) {
                    throw new RuntimeException("Akun uji {$email} sudah memiliki pendaftaran lain.");
                }
                $registration ??= OprecRegistration::create([
                    'oprec_id' => $oprec->id,
                    'user_id' => $user->id,
                    'nim' => $nim,
                    'tanggal_lahir' => $form['tanggal_lahir'],
                    'form_data' => $form,
                    'file_uploads' => [],
                    'divisi_pilihan_1' => $chosen[0]->id,
                    'divisi_pilihan_2' => $chosen[1]->id,
                    'divisi_pilihan_3' => $chosen[2]->id,
                    'status' => 'pending',
                ]);

                if (OprecTestSubmission::where('oprec_stage_id', $stage->id)->where('user_id', $user->id)->exists()) continue;
                $answers = [];
                foreach ($questions as $question) {
                    $id = $question['id'] ?? null;
                    if (!$id) throw new RuntimeException('Soal Tes Tulis memiliki ID tidak valid.');
                    $value = $this->answerValue($question, $name, $number);
                    if ($value !== null) $answers[$id] = $value;
                }
                OprecTestSubmission::create([
                    'oprec_stage_id' => $stage->id,
                    'oprec_registration_id' => $registration->id,
                    'user_id' => $user->id,
                    'answers' => $answers,
                ]);
            }
        });
    }

    private function formValue(array $field, int $number): string
    {
        return match ($field['type'] ?? 'text') {
            'select', 'radio' => (string) ($field['options'][0]['value'] ?? ''),
            'checkbox' => 'on',
            'email' => "oprec.demo.".str_pad((string) $number, 2, '0', STR_PAD_LEFT).'@example.test',
            'tel' => '081200000'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            'url' => 'https://example.test/portofolio/'.$number,
            'number' => (string) ($field['min'] ?? $number),
            'date' => '2026-09-01',
            default => 'Jawaban contoh peserta '.$number.' untuk '.($field['label'] ?? 'pertanyaan').'.',
        };
    }

    private function answerValue(array $question, string $name, int $number): ?string
    {
        return match ($question['type'] ?? '') {
            'file' => null,
            'single_choice', 'select' => $question['options'][($number - 1) % max(1, count($question['options'] ?? []))] ?? null,
            'checkbox' => 'on',
            'email' => "oprec.demo.".str_pad((string) $number, 2, '0', STR_PAD_LEFT).'@example.test',
            'tel' => '081200000'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            'url' => 'https://example.test/jawaban/'.$number,
            'number' => (string) $number,
            'date' => '2026-09-01',
            'short_text', 'text' => str_contains(strtolower($question['label'] ?? ''), 'nama')
                ? $name : 'Jawaban contoh '.$number.' untuk '.($question['label'] ?? 'soal').'.',
            'paragraph', 'textarea' => "Peserta uji {$number} menjelaskan pengalaman, alasan bergabung, dan rencana kontribusi di HIMANIKA.",
            default => throw new RuntimeException('Tipe soal Tes Tulis tidak dikenal.'),
        };
    }
}
