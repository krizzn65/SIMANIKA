<?php

namespace App\Support;

use App\Models\Event;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class EventTimeline
{
    public const TYPES = ['registration_open', 'registration_close', 'technical_meeting', 'proposal', 'preliminary', 'finalists', 'grand_final', 'awarding', 'custom'];

    public static function schedule(array $items): array
    {
        if (count($items) < 2 || count($items) > 50) self::invalid('Tambahkan minimal satu batch pendaftaran dan maksimal 50 agenda.');
        $pairs = [];
        $ordered = [];
        foreach ($items as $item) {
            if (!is_array($item) || !in_array($item['type'] ?? null, self::TYPES, true)) self::invalid('Jenis agenda tidak valid.');
            $type = $item['type'];
            $title = trim((string) ($item['judul'] ?? ''));
            $date = $item['tanggal'] ?? null;
            if ($title === '' || mb_strlen($title) > 150 || !is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)
                || !checkdate((int) substr($date, 5, 2), (int) substr($date, 8, 2), (int) substr($date, 0, 4))) self::invalid('Isi nama dan tanggal yang valid untuk setiap agenda.');
            $batch = in_array($type, ['registration_open', 'registration_close'], true) ? filter_var($item['batch'] ?? null, FILTER_VALIDATE_INT) : null;
            if (in_array($type, ['registration_open', 'registration_close'], true) && (!$batch || $batch < 1 || $batch > 25)) self::invalid('Nomor batch pendaftaran tidak valid.');
            if ($batch !== null) {
                if (isset($pairs[$batch][$type])) self::invalid('Satu batch hanya boleh memiliki satu tanggal buka dan satu penutupan.');
                $pairs[$batch][$type] = $date;
            }
            $ordered[] = ['type' => $type, 'batch' => $batch, 'judul' => $title, 'tanggal' => $date];
        }
        if (!$pairs) self::invalid('Tambahkan pasangan Pendaftaran dan Penutupan Pendaftaran.');
        ksort($pairs);
        $previousClose = null;
        $expectedBatch = 1;
        foreach ($pairs as $number => $pair) {
            if ($number !== $expectedBatch++) self::invalid('Nomor batch harus berurutan mulai dari 1.');
            if (empty($pair['registration_open']) || empty($pair['registration_close'])) self::invalid('Tanggal buka dan penutupan pendaftaran harus selalu berpasangan.');
            if ($pair['registration_open'] >= $pair['registration_close']) self::invalid('Penutupan batch harus setelah pendaftaran dibuka.');
            if ($previousClose !== null && $pair['registration_open'] <= $previousClose) self::invalid('Batch pendaftaran berikutnya harus dibuka setelah batch sebelumnya ditutup.');
            $previousClose = $pair['registration_close'];
        }
        $latest = end($pairs);
        $batchCount = count($pairs);
        foreach ($ordered as &$item) {
            if (in_array($item['type'], ['registration_open', 'registration_close'], true)) {
                $item['judul'] = ($item['type'] === 'registration_open' ? 'Pendaftaran' : 'Penutupan Pendaftaran')
                    .($batchCount > 1 ? ' Batch '.$item['batch'] : '');
            }
        }
        unset($item);
        foreach ($ordered as $item) {
            if ($item['type'] === 'awarding' && $item['tanggal'] <= $latest['registration_close']) {
                self::invalid('Awarding & Penutupan harus pada hari setelah penutupan pendaftaran terakhir.');
            }
        }
        usort($ordered, fn ($a, $b) => strcmp($a['tanggal'], $b['tanggal']));
        $grandFinals = array_values(array_filter($ordered, fn ($item) => $item['type'] === 'grand_final'));
        $awards = array_values(array_filter($ordered, fn ($item) => $item['type'] === 'awarding'));
        if ($grandFinals && $awards && end($grandFinals)['tanggal'] >= $awards[0]['tanggal']) self::invalid('Awarding & Penutupan harus setelah Grand Final.');
        $program = array_values(array_filter($ordered, fn ($item) => !in_array($item['type'], ['registration_open', 'registration_close'], true)));
        return [
            'timeline' => $ordered,
            'buka_pendaftaran' => $latest['registration_open'],
            'deadline_pendaftaran' => $latest['registration_close'],
            'tanggal_mulai' => ($program[0] ?? $ordered[0])['tanggal'],
            'tanggal_selesai' => end($ordered)['tanggal'],
        ];
    }

    public static function registrationTimes(Event $event): array
    {
        $pairs = [];
        foreach ($event->timeline ?? [] as $item) {
            if (in_array($item['type'] ?? null, ['registration_open', 'registration_close'], true) && is_numeric($item['batch'] ?? null)) {
                $pairs[(int) $item['batch']][$item['type']] = $item;
            }
        }
        if ($pairs) {
            ksort($pairs);
            $latest = end($pairs);
            if (isset($latest['registration_open'], $latest['registration_close'])) {
                return [
                    CarbonImmutable::parse($latest['registration_open']['tanggal'].' 00:00:00', 'Asia/Jakarta'),
                    CarbonImmutable::parse($latest['registration_close']['tanggal'], 'Asia/Jakarta')->endOfDay(),
                ];
            }
        }
        return [
            $event->buka_pendaftaran ? CarbonImmutable::parse($event->buka_pendaftaran->format('Y-m-d').' 00:00', 'Asia/Jakarta') : null,
            $event->deadline_pendaftaran ? CarbonImmutable::parse($event->deadline_pendaftaran->format('Y-m-d'), 'Asia/Jakarta')->endOfDay() : null,
        ];
    }

    public static function isOpen(Event $event): bool
    {
        [$open, $close] = self::registrationTimes($event);
        $now = CarbonImmutable::now('Asia/Jakarta');
        return $event->status === 'published'
            && (!$open || $now->gte($open))
            && (!$close || $now->lte($close))
            && (!$event->tanggal_selesai || $now->lte(CarbonImmutable::parse($event->tanggal_selesai->format('Y-m-d').' 23:59:59', 'Asia/Jakarta')));
    }

    private static function invalid(string $message): never
    {
        throw ValidationException::withMessages(['timeline' => [$message]]);
    }
}
