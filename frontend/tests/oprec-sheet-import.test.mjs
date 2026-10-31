import test from "node:test";
import assert from "node:assert/strict";
import { mapOprecSheetRecord, parseOprecSheet, safeDriveUrl } from "../src/lib/oprecSheetImport.mjs";

test("Google Form TSV maps identity, divisions, reasons, consent and Drive references", () => {
  const input = [
    "Timestamp\tNama Lengkap \tNIM \tEmail Aktif \tPilihan Pertama \tPilihan Kedua \tPilihan Ketiga \tAlasan memilih divisi pertama \tFoto KTM\tSaya menyatakan bahwa data yang saya isi dalam formulir ini benar dan dapat dipertanggungjawabkan",
    "27/10/2026 19:10:55\tPeserta Contoh\tE312345\tpeserta@example.test\tDivisi Ristek (Riset dan Teknologi)\tDivisi Kominfo\tDivisi Kewirausahaan\tIngin belajar\thttps://drive.google.com/open?id=abc\tYa",
  ].join("\n");
  const { records } = parseOprecSheet(input);
  const fields = [
    { name: "nama", label: "Nama lengkap", type: "text" }, { name: "nim", label: "NIM", type: "text" },
    { name: "alasan_divisi_1", label: "Alasan memilih divisi pertama", type: "textarea" },
    { name: "ktm_sim_online", label: "Upload KTM/SIM Online", type: "file" },
  ];
  const divisions = ["Ristek", "Kominfo", "Kewirausahaan"].map((nama, index) => ({ id: String(index + 1), nama }));
  const result = mapOprecSheetRecord(records[0], fields, divisions);
  assert.equal(result.email, "peserta@example.test");
  assert.equal(result.values.nama, "Peserta Contoh");
  assert.equal(result.values.divisi_pilihan_1, "1");
  assert.equal(result.values.divisi_pilihan_2, "2");
  assert.equal(result.values.divisi_pilihan_3, "3");
  assert.equal(result.values.alasan_divisi_1, "Ingin belajar");
  assert.equal(result.values.persetujuan_data_benar, "on");
  assert.equal(result.files.ktm_sim_online, "https://drive.google.com/open?id=abc");
});

test("CSV quotes retain commas and line breaks inside an answer", () => {
  const { records } = parseOprecSheet('Email Aktif,Nama Lengkap,Alasan\r\npeserta@example.test,"Nama, Contoh","Baris 1\nBaris 2"');
  assert.equal(records[0].values["Nama Lengkap"], "Nama, Contoh");
  assert.equal(records[0].values.Alasan, "Baris 1\nBaris 2");
});

test("only Google Drive links are rendered as source links", () => {
  assert.equal(safeDriveUrl("https://drive.google.com/open?id=abc"), "https://drive.google.com/open?id=abc");
  assert.equal(safeDriveUrl("javascript:alert(1)"), null);
  assert.equal(safeDriveUrl("https://example.com/file"), null);
});

test("long Google Form division name resolves to the period's short division name", () => {
  const sheet = parseOprecSheet("Email Aktif\tPilihan Pertama\tPilihan Kedua\tPilihan Ketiga\npeserta@example.test\tDivisi Kewirausahaan\tDivisi Ristek (Riset dan Teknologi)\tDivisi Kominfo");
  const divisions = ["KWU", "Ristek", "Kominfo"].map((nama, index) => ({ id: String(index + 1), nama, namaLengkap: "" }));
  const mapped = mapOprecSheetRecord(sheet.records[0], [], divisions);
  assert.deepEqual([1, 2, 3].map((rank) => mapped.values[`divisi_pilihan_${rank}`]), ["1", "2", "3"]);
});
