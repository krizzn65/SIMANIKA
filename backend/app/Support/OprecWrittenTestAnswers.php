<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class OprecWrittenTestAnswers
{
    public static function validateAndStore(array $questions, array $raw, int $stageId, array &$stored): array
    {
        if (array_diff(array_keys($raw), array_column($questions, 'id'))) {
            throw ValidationException::withMessages(['answers' => ['Jawaban memuat pertanyaan yang tidak berlaku.']]);
        }
        $answers = [];
        $uploadBytes = 0;
        foreach ($questions as $question) {
            $id = $question['id'];
            $type = $question['type'];
            $value = $raw[$id] ?? null;
            if ($value === null || $value === '') {
                if ($question['required']) throw ValidationException::withMessages(["answers.$id" => ['Pertanyaan ini wajib dijawab.']]);
                continue;
            }
            if ($type === 'file') {
                if (!$value instanceof UploadedFile) throw ValidationException::withMessages(["answers.$id" => ['Jawaban harus berupa berkas.']]);
                $uploadBytes += $value->getSize();
                if ($uploadBytes > 11 * 1024 * 1024) throw ValidationException::withMessages(['answers' => ['Ukuran total berkas maksimal 11 MB.']]);
                Validator::make(['file' => $value], ['file' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120']])->validate();
                $path = $value->store("oprec/test/{$stageId}", 'local');
                if (!is_string($path)) throw new \RuntimeException('Private file storage failed');
                $stored[] = $path;
                $answers[$id] = ['path' => $path, 'name' => basename($value->getClientOriginalName())];
                continue;
            }
            if (!is_string($value)) throw ValidationException::withMessages(["answers.$id" => ['Jawaban harus berupa teks.']]);
            $value = trim($value);
            if ($value === '') {
                if ($question['required']) throw ValidationException::withMessages(["answers.$id" => ['Pertanyaan ini wajib dijawab.']]);
                continue;
            }
            $limit = $type === 'paragraph' ? 5000 : ($type === 'short_text' ? 500 : 200);
            if (mb_strlen($value) > $limit) throw ValidationException::withMessages(["answers.$id" => ["Jawaban maksimal $limit karakter."]]);
            if (in_array($type, ['single_choice', 'select'], true) && !in_array($value, $question['options'] ?? [], true)) throw ValidationException::withMessages(["answers.$id" => ['Pilihan jawaban tidak tersedia.']]);
            if ($type === 'checkbox' && $value !== 'on') throw ValidationException::withMessages(["answers.$id" => ['Persetujuan tidak valid.']]);
            if ($type === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) throw ValidationException::withMessages(["answers.$id" => ['Alamat email tidak valid.']]);
            if ($type === 'tel' && !preg_match('/^[0-9+() .-]{5,30}$/D', $value)) throw ValidationException::withMessages(["answers.$id" => ['Nomor telepon tidak valid.']]);
            if ($type === 'url' && (!filter_var($value, FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($value, PHP_URL_SCHEME) ?? ''), ['http', 'https'], true))) throw ValidationException::withMessages(["answers.$id" => ['Link harus diawali http atau https.']]);
            if ($type === 'number' && !preg_match('/^-?[0-9]+(?:\.[0-9]+)?$/D', $value)) throw ValidationException::withMessages(["answers.$id" => ['Angka tidak valid.']]);
            if ($type === 'date') {
                $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);
                if (!$date || $date->format('Y-m-d') !== $value) throw ValidationException::withMessages(["answers.$id" => ['Tanggal tidak valid.']]);
            }
            $answers[$id] = $value;
        }
        return $answers;
    }

    public static function publicAnswers(array $answers): array
    {
        return array_map(fn ($value) => is_array($value) ? 'Berkas terlampir' : $value, $answers);
    }

    public static function files(array $answers, string $baseUrl): array
    {
        $files = [];
        foreach ($answers as $id => $value) {
            if (is_array($value) && isset($value['path'])) $files[$id] = $baseUrl.'/'.rawurlencode($id);
        }
        return $files;
    }

    public static function deleteFiles(array $answers): void
    {
        foreach ($answers as $value) {
            if (is_array($value) && isset($value['path'])) Storage::disk('local')->delete($value['path']);
        }
    }
}
