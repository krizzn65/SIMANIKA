import test from "node:test";
import assert from "node:assert/strict";
import { isFieldApplicable, normalizeOprec, validateOprecForm, getDefaultJabatan } from "../src/lib/oprec.js";

test("isFieldApplicable safely handles divisions with null or undefined properties", () => {
  const fieldTargetingBph = {
    name: "alasan_bph",
    targetType: "specific",
    targetDivisions: ["BPH"],
  };

  const divisions = [
    { id: "1", nama: "BPH", namaLengkap: null },
    { id: "2", nama: "Humas", namaLengkap: undefined },
    { id: "3", nama: "Ristek", namaLengkap: "Riset dan Teknologi" },
  ];

  // When no choices are selected yet:
  assert.equal(isFieldApplicable(fieldTargetingBph, [], divisions), false);

  // When another division is selected (should not crash even with null namaLengkap):
  assert.equal(isFieldApplicable(fieldTargetingBph, ["2"], divisions), false);

  // When targeted division is selected by ID:
  assert.equal(isFieldApplicable(fieldTargetingBph, ["1"], divisions), true);

  // When targeted division is selected by name:
  assert.equal(isFieldApplicable(fieldTargetingBph, ["BPH"], divisions), true);
  assert.equal(isFieldApplicable(fieldTargetingBph, ["bph"], divisions), true);

  // General field (targetType: "all"):
  const allField = { name: "nama", targetType: "all", targetDivisions: [] };
  assert.equal(isFieldApplicable(allField, [], divisions), true);
  assert.equal(isFieldApplicable(allField, ["1", "2"], divisions), true);
});

test("normalizeOprec standardizes division positions for registration catalog", () => {
  const rawData = {
    id: 1,
    periode: "2026/2027",
    status: "open",
    tanggal_buka: "2026-10-28T00:00:00+07:00",
    tanggal_tutup: "2026-11-04T23:59:59+07:00",
    form_fields: [
      { name: "nim", type: "text", label: "NIM", required: true },
      { name: "tanggal_lahir", type: "date", label: "Tanggal lahir", required: true },
    ],
    divisi_tersedia: [
      {
        id: 1,
        nama: "BPH",
        namaLengkap: "Badan Pengurus Harian",
        jabatan: ["Ketua Umum", "Sekretaris 1", "Bendahara 1"],
      },
      {
        id: 2,
        nama: "Humas",
        namaLengkap: "Hubungan Masyarakat",
        jabatan: ["Ketua Divisi Humas"],
      },
    ],
  };

  const normalized = normalizeOprec(rawData);
  assert.equal(normalized.periode, "2026/2027");
  assert.equal(normalized.status, "open");
  assert.equal(normalized.divisiTersedia.length, 2);
  assert.deepEqual(normalized.divisiTersedia[0].jabatan, ["Wakil Ketua Umum", "Sekretaris 2", "Bendahara 2"]);
  assert.deepEqual(normalized.divisiTersedia[1].jabatan, ["Staff Divisi Humas"]);
});

test("validateOprecForm validates positions against custom divisions correctly", () => {
  const divisions = [
    {
      id: "1",
      nama: "BPH",
      jabatan: ["Wakil Ketua Umum", "Sekretaris 2", "Bendahara 2"],
    },
    {
      id: "2",
      nama: "Humas",
      jabatan: ["Staff Divisi Humas"],
    },
    {
      id: "3",
      nama: "Ristek",
      jabatan: ["Staff Divisi Ristek"],
    },
  ];

  const form = new FormData();
  form.set("divisi_pilihan_1", "1");
  form.set("jabatan_pilihan_1", "Wakil Ketua Umum");
  form.set("divisi_pilihan_2", "2");
  form.set("jabatan_pilihan_2", "Staff Divisi Humas");
  form.set("divisi_pilihan_3", "3");
  form.set("jabatan_pilihan_3", "Staff Divisi Ristek");
  form.set("nim", "E31230001");
  form.set("tanggal_lahir", "2005-05-15");

  const fields = [
    { name: "nim", type: "text", label: "NIM", required: true, maxLength: 32 },
    { name: "tanggal_lahir", type: "date", label: "Tanggal lahir", required: true },
  ];

  const errors = validateOprecForm(fields, form, Date.now(), divisions);
  assert.deepEqual(errors, {});
});
