import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const oprecSource = await readFile(new URL("../src/lib/oprec.js", import.meta.url), "utf8");
const oprecUrl = `data:text/javascript;base64,${Buffer.from(oprecSource).toString("base64")}`;
const tableSource = (await readFile(new URL("../src/lib/oprecRegistrants.js", import.meta.url), "utf8"))
  .replace('from "./oprec.js"', `from "${oprecUrl}"`);
const { getOprecTableFields, getRegistrantFieldValue, getRegistrantFormData } = await import(`data:text/javascript;base64,${Buffer.from(tableSource).toString("base64")}`);

test("keeps every admin question, including division-specific questions, exactly once", () => {
  const fields = [
    { name: "nama" }, { name: "nim" }, { name: "tanggal_lahir" }, { name: "angkatan" },
    { name: "divisi_pilihan_1" }, { name: "motivasi", label: "Motivasi" },
    { name: "portfolio", label: "Portofolio", target_type: "specific", target_divisions: ["Kominfo"] },
    { name: "motivasi", label: "Duplikat" },
  ];
  assert.deepEqual(getOprecTableFields(fields).map((field) => field.name), ["motivasi", "portfolio"]);
});

test("renders conditional answers, missing values and private file links safely", () => {
  const divisions = [{ id: 7, nama: "Kominfo" }, { id: 8, nama: "BPH" }];
  const field = { name: "portfolio", target_type: "specific", target_divisions: ["Kominfo"] };
  const registrant = { divisiPilihan1: 8, formData: JSON.stringify({ portfolio: "https://example.test" }) };
  assert.deepEqual(getRegistrantFieldValue(registrant, field, divisions), { text: "Tidak berlaku" });
  registrant.divisiPilihan2 = 7;
  assert.deepEqual(getRegistrantFieldValue(registrant, field, divisions), { text: "https://example.test" });
  assert.deepEqual(getRegistrantFieldValue(registrant, { name: "empty" }, divisions), { text: "—" });
  assert.deepEqual(getRegistrantFieldValue(registrant, { name: "cv", type: "file" }, divisions), { text: "—" });
  registrant.fileUploads = { cv: { downloadUrl: "/api/admin/oprec/1/registrants/2/files/cv" } };
  assert.equal(getRegistrantFieldValue(registrant, { name: "cv", type: "file" }, divisions).downloadUrl, registrant.fileUploads.cv.downloadUrl);
  registrant.fileUploads.cv.available = false;
  assert.deepEqual(getRegistrantFieldValue(registrant, { name: "cv", type: "file" }, divisions), { text: "Berkas tidak tersedia", missing: true });
  assert.deepEqual(getRegistrantFormData({ formData: "broken" }), {});
});
