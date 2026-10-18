import assert from "node:assert/strict";
import test from "node:test";
import { OPREC_FIXED_FIELDS, normalizeFields, validateOprecForm } from "../src/lib/oprec.js";
import { getOprecSummaryRows } from "../src/lib/oprecWorkspaceSummary.js";

test("pertanyaan sistem baru berurutan dan divalidasi", () => {
  assert.deepEqual(OPREC_FIXED_FIELDS.map((field) => field.name), [
    "nama", "nim", "tanggal_lahir", "angkatan", "golongan", "nomor_wa", "ktm_sim_online", "surat_pernyataan", "status_kepengurusan",
  ]);
  const fields = normalizeFields(OPREC_FIXED_FIELDS);
  assert.deepEqual(fields[3].options.map(({ value }) => value), ["2025", "2026"]);
  assert.deepEqual(fields[4].options.map(({ value }) => value), ["A", "B", "C", "D", "E"]);
  assert.deepEqual(fields[8].options.map(({ value }) => value), ["Anggota Baru", "Melanjutkan Periode kedua"]);

  const form = new FormData();
  form.set("nama", "Peserta Uji");
  form.set("nim", "E3126001");
  form.set("tanggal_lahir", "2005-01-01");
  form.set("angkatan", "2026");
  form.set("golongan", "F");
  form.set("nomor_wa", "nomor tidak valid");
  const errors = validateOprecForm(fields, form);
  assert.ok(errors.golongan);
  assert.ok(errors.nomor_wa);
  assert.ok(errors.ktm_sim_online);
  assert.ok(errors.surat_pernyataan);
  form.set("golongan", "A");
  form.set("nomor_wa", "08123456789");
  assert.equal(validateOprecForm(fields, form).golongan, undefined);
  assert.equal(validateOprecForm(fields, form).nomor_wa, undefined);
  const edited = normalizeFields(OPREC_FIXED_FIELDS.map((field) => field.name === "golongan"
    ? { ...field, options: [{ value: "X", label: "X" }] }
    : field));
  form.set("golongan", "X");
  assert.equal(validateOprecForm(edited, form).golongan, undefined);
});

test("ringkasan peserta menempatkan identitas di awal dan jabatan di dalam divisi", () => {
  const registration = {
    nim: "E3126001", tanggalLahir: "2005-01-01", divisiPilihan1: 7,
    formData: { angkatan: "2026", golongan: "A", nomor_wa: "08123456789", status_kepengurusan: "Anggota Baru", jabatan_pilihan_1: "Staff Divisi Humas", nama: "Peserta Uji" },
    uploadedFileFields: ["ktm_sim_online", "surat_pernyataan"],
  };
  const rows = getOprecSummaryRows(registration, OPREC_FIXED_FIELDS, new Map([[7, "Humas"]]), "Peserta Uji", "1 Januari 2005");
  assert.deepEqual(rows.map((row) => row.label), [
    "Nama lengkap", "NIM", "Tanggal lahir", "Angkatan", "Golongan", "Nomor WA",
    "Upload KTM/SIM Online", "Upload Surat Pernyataan", "Status Kepengurusan", "Divisi Pilihan 1",
  ]);
  assert.equal(rows[9].value, "Humas (Staff Divisi Humas)");
  assert.equal(rows[6].value, "Berkas diunggah");
});
