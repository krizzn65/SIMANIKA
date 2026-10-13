<?php

namespace App\Support;

use App\Models\Oprec;
use Illuminate\Support\Collection;
use ZipArchive;

class OprecRegistrantDocument
{
    private string $period;
    private array $headers;
    private array $rows;

    public function __construct(Oprec $oprec, Collection $registrations)
    {
        $this->period = $oprec->periode;
        $divisions = $oprec->divisions->pluck('nama', 'id');
        $fields = collect($oprec->form_fields ?? [])->filter(fn ($field) => !in_array($field['name'] ?? '', [
            'nama', 'nama_lengkap', 'namaLengkap', 'nim', 'tanggal_lahir', 'angkatan',
            'divisi_pilihan_1', 'divisi_pilihan_2', 'divisi_pilihan_3',
        ], true))->values();
        $this->headers = array_merge(['No.', 'Nama', 'NIM', 'Email', 'Tanggal lahir', 'Angkatan',
            'Divisi pilihan 1', 'Divisi pilihan 2', 'Divisi pilihan 3', 'Tanggal daftar'],
            $fields->map(fn ($field) => $field['label'] ?? $field['name'])->all());
        $this->rows = $registrations->values()->map(function ($item, $index) use ($divisions, $fields) {
            $form = $item->form_data ?? [];
            $values = [
                (string) ($index + 1),
                (string) ($form['nama'] ?? $form['nama_lengkap'] ?? $form['namaLengkap'] ?? $item->user?->name ?? ''),
                (string) $item->nim,
                (string) ($item->user?->email ?? ''),
                $item->tanggal_lahir?->format('Y-m-d') ?? '',
                (string) ($form['angkatan'] ?? ''),
            ];
            foreach ([1, 2, 3] as $rank) {
                $id = $item->{'divisi_pilihan_'.$rank};
                $values[] = $id ? (string) ($divisions[$id] ?? "Divisi #{$id}") : '';
            }
            $values[] = $item->created_at?->timezone('Asia/Jakarta')->format('Y-m-d H:i').' WIB' ?? '';
            foreach ($fields as $field) {
                $name = $field['name'];
                $value = $field['type'] === 'file' ? (empty($item->file_uploads[$name]) ? '' : 'Berkas tersedia') : ($form[$name] ?? '');
                $values[] = is_array($value) ? implode(', ', array_map('strval', $value)) : (is_bool($value) ? ($value ? 'Ya' : 'Tidak') : (string) $value);
            }
            return $values;
        })->all();
    }

    public function xlsx(): string
    {
        $lastColumn = self::columnName(count($this->headers));
        $lastRow = count($this->rows) + 1;
        $widths = [7, 27, 18, 34, 17, 13, 23, 23, 23, 23];
        foreach (array_slice($this->headers, 10) as $header) $widths[] = min(48, max(24, mb_strlen($header) + 4));
        $sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
            .'<cols>';
        foreach ($widths as $index => $width) $sheet .= '<col min="'.($index + 1).'" max="'.($index + 1).'" width="'.$width.'" customWidth="1"/>';
        $sheet .= '</cols><sheetData>';
        foreach (array_merge([$this->headers], $this->rows) as $index => $row) {
            $lines = 1;
            foreach ($row as $column => $value) {
                $cellLines = 0;
                foreach (preg_split('/\r\n|\r|\n/', (string) $value) as $part) {
                    $cellLines += max(1, (int) ceil(mb_strlen($part) / max(1, $widths[$column] - 3)));
                }
                $lines = max($lines, $cellLines);
            }
            $height = $index === 0 ? 32 : min(120, max(26, $lines * 16 + 8));
            $sheet .= '<row r="'.($index + 1).'" ht="'.$height.'" customHeight="1">';
            foreach ($row as $value) {
                $style = $index === 0 ? 1 : ($index % 2 === 0 ? 3 : 2);
                $clean = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', (string) $value);
                $sheet .= '<c s="'.$style.'" t="inlineStr"><is><t xml:space="preserve">'
                    .htmlspecialchars($clean, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</t></is></c>';
            }
            $sheet .= '</row>';
        }
        $sheet .= '</sheetData><autoFilter ref="A1:'.$lastColumn.$lastRow.'"/></worksheet>';
        $path = tempnam(sys_get_temp_dir(), 'oprec-xlsx-');
        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::OVERWRITE) !== true) throw new \RuntimeException('Gagal membuat berkas Excel.');
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Calon Peserta" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
        $zip->addFromString('xl/worksheets/sheet1.xml', $sheet);
        $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2"><font><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>'
            .'<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FF155EEF"/><bgColor indexed="64"/></patternFill></fill>'
            .'<fill><patternFill patternType="solid"><fgColor rgb="FFF0F6FF"/><bgColor indexed="64"/></patternFill></fill></fills>'
            .'<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border>'
            .'<left/><right/><top/><bottom style="hair"><color rgb="FFD6E3F2"/></bottom><diagonal/></border></borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            .'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>'
            .'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
            .'<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>'
            .'</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
        $zip->close();
        $bytes = file_get_contents($path);
        unlink($path);
        return $bytes;
    }

    private static function columnName(int $number): string
    {
        $name = '';
        while ($number > 0) {
            $number--;
            $name = chr(65 + $number % 26).$name;
            $number = intdiv($number, 26);
        }
        return $name;
    }

    public function pdf(): string
    {
        $streams = [];
        $commands = '';
        $y = 0;
        $text = function (string $value, float $x, float $baseline, int $size = 8, bool $bold = false, string $color = '0.13 0.18 0.27') use (&$commands): void {
            $plain = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $value) ?: '';
            $plain = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $plain);
            $commands .= "BT {$color} rg /F".($bold ? '2' : '1')." {$size} Tf 1 0 0 1 ".self::pdfNumber($x).' '.self::pdfNumber($baseline)." Tm ({$plain}) Tj ET\n";
        };
        $rect = function (float $x, float $bottom, float $width, float $height, string $fill, string $stroke = '0.82 0.87 0.93') use (&$commands): void {
            $commands .= "q {$fill} rg ".self::pdfNumber($x).' '.self::pdfNumber($bottom).' '.self::pdfNumber($width).' '.self::pdfNumber($height)." re f Q\n";
            $commands .= "q {$stroke} RG 0.5 w ".self::pdfNumber($x).' '.self::pdfNumber($bottom).' '.self::pdfNumber($width).' '.self::pdfNumber($height)." re S Q\n";
        };
        $page = function (string $section) use (&$streams, &$commands, &$y, $text, $rect): void {
            if ($commands !== '') $streams[] = $commands;
            $commands = '';
            $rect(0, 555, 842, 40, '0.08 0.24 0.51', '0.08 0.24 0.51');
            $text('DAFTAR CALON PESERTA OPREC', 35, 571, 14, true, '1 1 1');
            $text('Periode '.$this->period.'  |  '.$section.'  |  '.count($this->rows).' peserta', 35, 541, 9);
            $y = 523;
        };
        $wrap = static function (string $value, float $width): array {
            $plain = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', trim($value)) ?: '';
            $plain = preg_replace('/\s+/', ' ', $plain);
            return explode("\n", wordwrap($plain === '' ? '-' : $plain, max(1, (int) floor(($width - 12) / 4.8)), "\n", true));
        };
        $row = function (array $cells, array $widths, bool $header, int $stripe = 0) use (&$y, $text, $rect, $wrap): void {
            $lines = [];
            foreach ($cells as $index => $cell) $lines[] = $wrap((string) $cell, $widths[$index]);
            $height = max(25, max(array_map('count', $lines)) * 10 + 9);
            $x = 35;
            foreach ($cells as $index => $cell) {
                $fill = $header ? '0.88 0.93 1' : ($stripe % 2 === 0 ? '1 1 1' : '0.96 0.98 1');
                $rect($x, $y - $height, $widths[$index], $height, $fill);
                foreach ($lines[$index] as $lineNumber => $line) {
                    $text($line, $x + 6, $y - 12 - $lineNumber * 10, 8, $header);
                }
                $x += $widths[$index];
            }
            $y -= $height;
        };

        $summaryWidths = [28, 105, 70, 156, 58, 255, 100];
        $summaryHeaders = ['No.', 'Nama', 'NIM', 'Email', 'Angkatan', 'Divisi pilihan', 'Tanggal daftar'];
        $page('Ringkasan');
        $row($summaryHeaders, $summaryWidths, true);
        foreach ($this->rows as $index => $data) {
            $choices = array_filter([$data[6], $data[7], $data[8]]);
            $summary = [$data[0], $data[1], $data[2], $data[3], $data[5], implode(' / ', $choices), $data[9]];
            $maxLines = 1;
            foreach ($summary as $column => $value) $maxLines = max($maxLines, count($wrap((string) $value, $summaryWidths[$column])));
            if ($y - max(25, $maxLines * 10 + 9) < 42) {
                $page('Ringkasan (lanjutan)');
                $row($summaryHeaders, $summaryWidths, true);
            }
            $row($summary, $summaryWidths, false, $index);
        }

        if ($this->rows) {
            $page('Rincian formulir');
            foreach ($this->rows as $index => $data) {
                if ($y < 130) $page('Rincian formulir (lanjutan)');
                $text($data[0].'. '.$data[1].' ('.$data[2].')', 35, $y - 12, 10, true);
                $y -= 24;
                $row(['Kolom', 'Jawaban'], [165, 607], true);
                foreach (array_slice($this->headers, 3) as $offset => $label) {
                    $value = (string) ($data[$offset + 3] ?? '');
                    $height = max(25, max(count($wrap($label, 165)), count($wrap($value, 607))) * 10 + 9);
                    if ($y - $height < 42) {
                        $page('Rincian formulir (lanjutan)');
                        $text($data[0].'. '.$data[1].' ('.$data[2].')', 35, $y - 12, 10, true);
                        $y -= 24;
                        $row(['Kolom', 'Jawaban'], [165, 607], true);
                    }
                    $row([$label, $value], [165, 607], false, $offset);
                }
                $y -= 15;
            }
        }
        $streams[] = $commands;
        $objects = [1 => '<< /Type /Catalog /Pages 2 0 R >>', 2 => ''];
        $kids = [];
        $fontId = 3 + count($streams) * 2;
        foreach ($streams as $number => $stream) {
            $pageId = count($objects) + 1;
            $streamId = $pageId + 1;
            $kids[] = $pageId.' 0 R';
            $footer = "BT 0.4 0.46 0.55 rg /F1 8 Tf 1 0 0 1 35 22 Tm (Halaman ".($number + 1).' / '.count($streams).") Tj ET\n";
            $stream .= $footer;
            $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 {$fontId} 0 R /F2 ".($fontId + 1)." 0 R >> >> /Contents {$streamId} 0 R >>";
            $objects[$streamId] = '<< /Length '.strlen($stream)." >>\nstream\n".$stream."\nendstream";
        }
        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($streams).' >>';
        $objects[$fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[$fontId + 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        for ($id = 1; $id <= count($objects); $id++) {
            $offsets[$id] = strlen($pdf);
            $pdf .= $id." 0 obj\n".$objects[$id]."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        for ($id = 1; $id <= count($objects); $id++) $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        return $pdf.'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }

    private static function pdfNumber(float $value): string
    {
        return sprintf('%.2F', $value);
    }
}
