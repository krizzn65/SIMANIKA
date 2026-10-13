import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const source = await readFile(new URL("../src/lib/oprec.js", import.meta.url), "utf8");
const { normalizeOprec, normalizeFields, oprecState, oprecDate, validBirthDate, validHttpUrl, validateOprecForm, normalizeOprecNim, oprecNimProgramWarning, oprecNimError, safePosterUrl, isFieldApplicable } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const identity = [{ name: "nim", type: "text", label: "NIM", required: true }, { name: "tanggal_lahir", type: "date", label: "Tanggal lahir", required: true }];
const raw = { id: 1, periode: "2026/2027", status: "open", tanggalBuka: "2026-10-01T08:00:00+07:00", tanggalTutup: "2026-10-14T23:59:00+07:00", divisiTersedia: [{ nama: "Kominfo", jabatan: ["Staff Divisi Kominfo"] }, { nama: "Humas" }, { nama: "PSDM" }], formFields: identity };
const oprec = normalizeOprec(raw);

test("registration catalog is fixed even when an old payload contains acceptance positions", () => {
  const period = normalizeOprec({ ...raw, divisiTersedia: [
    { id: 1, nama: "BPH", jabatan: ["Ketua Umum", "Sekretaris 1", "Bendahara 1"] },
    { id: 2, nama: "Humas", jabatan: ["Ketua Divisi Humas", "Staff Bidang Internal"] },
    { id: 3, nama: "Kominfo", jabatan: ["Koordinator Kominfo", "Staff Copywriting"] },
  ] });
  assert.deepEqual(period.divisiTersedia.map(item => item.jabatan), [
    ["Wakil Ketua Umum", "Sekretaris 2", "Bendahara 2"], ["Staff Divisi Humas"], ["Staff Divisi Kominfo"],
  ]);
  const form = new FormData();
  [1, 2, 3].forEach(rank => form.set(`divisi_pilihan_${rank}`, String(rank)));
  assert.ok(validateOprecForm([], form, Date.now(), period.divisiTersedia).jabatan_pilihan_1);
  for (const forbidden of ["Ketua Umum", "Sekretaris 1", "Bendahara 1"]) {
    form.set("jabatan_pilihan_1", forbidden);
    assert.ok(validateOprecForm([], form, Date.now(), period.divisiTersedia).jabatan_pilihan_1);
  }
  form.set("jabatan_pilihan_1", "Bendahara 2");
  assert.equal(validateOprecForm([], form, Date.now(), period.divisiTersedia).jabatan_pilihan_1, undefined);
});
const start = Date.parse(raw.tanggalBuka);
const end = Date.parse(raw.tanggalTutup);

test("birth date uses the current WIB date at the UTC day boundary", () => {
  const now = Date.parse("2026-10-01T17:01:00Z");
  assert.equal(validBirthDate("2026-10-02", now), true);
  assert.equal(validBirthDate("2026-10-03", now), false);
});

test("positions must belong to the selected division", () => {
  const divisions = [{ id: "1", nama: "BPH", jabatan: ["Sekretaris 2"] }, { id: "2", nama: "Humas" }, { id: "3", nama: "PSDM" }];
  const form = new FormData();
  ["1", "2", "3"].forEach((id, index) => form.set(`divisi_pilihan_${index + 1}`, id));
  form.set("jabatan_pilihan_1", "Ketua Palsu");
  assert.ok(validateOprecForm([], form, Date.now(), divisions).jabatan_pilihan_1);
  form.set("jabatan_pilihan_1", "Sekretaris 2");
  assert.deepEqual(validateOprecForm([], form, Date.now(), divisions), {});
});

test("registration boundaries: empty, countdown, open, closed", () => {
  assert.equal(oprecState(null).key, "empty");
  assert.equal(oprecState(oprec, start - 1).key, "soon");
  assert.equal(oprecState(oprec, start - 1).target, raw.tanggalBuka);
  assert.equal(oprecState(oprec, start).key, "open");
  assert.equal(oprecState(oprec, end - 1).key, "open");
  assert.equal(oprecState(oprec, end).key, "closed");
  assert.equal(oprecState({ ...oprec, status: "closed" }, start).key, "closed");
  assert.equal(oprecState({ ...oprec, tanggalTutup: null }, start).key, "empty");
  assert.equal(oprecState({ ...oprec, divisiTersedia: [] }, start).key, "empty");
  assert.equal(oprecState({ ...oprec, divisiTersedia: oprec.divisiTersedia.slice(0, 2) }, start).key, "empty");
});
test("announcement publication and schedule gate result lookup", () => {
  const announcement = normalizeOprec({ ...raw, pengumuman: { published: true, tanggal: "2026-10-20T08:00:00+07:00" } });
  const publication = Date.parse(announcement.pengumuman.tanggal);
  assert.equal(oprecState(announcement, start).key, "open");
  assert.equal(oprecState(announcement, end).key, "closed");
  assert.equal(oprecState(announcement, end).target, announcement.pengumuman.tanggal);
  assert.equal(oprecState(announcement, publication).key, "announcement");
  assert.equal(oprecState({ ...announcement, pengumuman: { ...announcement.pengumuman, published: false } }, publication).key, "closed");
  assert.equal(oprecState({ ...announcement, status: "closed", pengumuman: { published: true, tanggal: null } }, start).key, "announcement");
});
test("reject malformed periods and dates without timezones", () => {
  assert.equal(normalizeOprec(null), null);
  assert.equal(oprecState(normalizeOprec({ ...raw, status: "draft" }), start).key, "empty");
  for (const data of [undefined, {}, { ...raw, id: "../admin" }, { ...raw, status: "unknown" }, { ...raw, tanggalBuka: "2026-10-01T08:00:00" }, { ...raw, tanggalTutup: raw.tanggalBuka }]) assert.throws(() => normalizeOprec(data));
});
test("field schema requires identity, unique safe keys and supported types", () => {
  assert.equal(normalizeFields(identity).length, 2);
  assert.deepEqual(normalizeFields([]), []);
  for (const fields of [[identity[0]], [...identity, identity[0]], [...identity, { name: "constructor", type: "text", label: "A" }], [...identity, { name: "foo", type: "html", label: "A" }], [...identity, { name: "foo", type: "select", label: "A", options: [] }]]) assert.throws(() => normalizeFields(fields));
});
test("validates required fields, choices, checkbox, email and number ranges", () => {
  const fields = normalizeFields([...identity,
    { name: "email", type: "email", label: "Email", required: true },
    { name: "divisi", type: "select", label: "Divisi", options: ["Kominfo"], required: true },
    { name: "komitmen", type: "checkbox", label: "Komitmen", required: true },
    { name: "semester", type: "number", label: "Semester", min: 1, max: 8 },
  ]);
  const form = new FormData();
  assert.equal(Object.keys(validateOprecForm(fields, form)).length, 5);
  for (const [key, value] of Object.entries({ nim: "E312345", tanggal_lahir: "2005-02-28", email: "a@example.com", divisi: "Kominfo", komitmen: "on", semester: "3" })) form.set(key, value);
  assert.deepEqual(validateOprecForm(fields, form), {});
  form.set("divisi", "forged"); form.set("semester", "99"); form.set("email", "invalid"); form.set("komitmen", "no");
  assert.equal(Object.keys(validateOprecForm(fields, form)).length, 4);
  form.append("nim", "E99999");
  assert.ok(validateOprecForm(fields, form).nim);
});
test("OPREC NIM is normalized to uppercase and must start with E31", () => {
  const fields = normalizeFields(identity);
  const form = new FormData();
  form.set("tanggal_lahir", "2004-01-01");
  for (const nim of ["A312345", "E12345", "EE312345", "31E12345", "E31_1234", `E31${"1".repeat(30)}`]) {
    form.set("nim", nim);
    assert.ok(validateOprecForm(fields, form).nim, nim);
  }
  assert.equal(oprecNimError("A", true), "NIM tidak valid.");
  assert.equal(oprecNimError("E", true), null);
  assert.equal(oprecNimError("E3", true), null);
  assert.equal(oprecNimError("E31", true), null);
  assert.equal(oprecNimProgramWarning(""), null);
  assert.equal(oprecNimProgramWarning("e"), null);
  assert.equal(oprecNimProgramWarning("e3"), null);
  assert.equal(oprecNimProgramWarning("e31"), null);
  assert.equal(oprecNimProgramWarning("E312345"), null);
  assert.equal(oprecNimProgramWarning("E12"), "NIM ini bukan dari Prodi Manajemen Informatika.");
  assert.equal(normalizeOprecNim(" e31abc "), "E31ABC");
  form.set("nim", normalizeOprecNim("e312345"));
  assert.deepEqual(validateOprecForm(fields, form), {});
  form.set("nim", "E312345");
  assert.deepEqual(validateOprecForm(fields, form), {});
});
test("three division cards must be distinct and selected before submit", () => {
  const fields = normalizeFields([...identity, { name: "divisi_pilihan_1", type: "select", label: "Divisi pilihan", required: true, options: ["1", "2", "3", "4"] }]);
  const form = new FormData();
  form.set("nim", "E312345"); form.set("tanggal_lahir", "2004-01-01");
  form.set("divisi_pilihan_1", "1"); form.set("divisi_pilihan_2", "2");
  assert.ok(validateOprecForm(fields, form).divisi_pilihan_1);
  form.set("divisi_pilihan_3", "2");
  assert.ok(validateOprecForm(fields, form).divisi_pilihan_1);
  form.set("divisi_pilihan_3", "999");
  assert.ok(validateOprecForm(fields, form).divisi_pilihan_1);
  form.set("divisi_pilihan_3", "3");
  assert.deepEqual(validateOprecForm(fields, form), {});
});
test("birth date handles leap days, impossible dates and future dates", () => {
  assert.equal(validBirthDate("2004-02-29", start), true);
  for (const value of ["2005-02-29", "2026-02-31", "2100-01-01", "1899-12-31", "not-a-date"]) assert.equal(validBirthDate(value, start), false);
});
test("files have type and size limits", () => {
  const fields = normalizeFields([...identity, { name: "cv", type: "file", label: "CV", accept: [".pdf"], maxSizeMB: 1 }]);
  const form = new FormData(); form.set("nim", "E312345"); form.set("tanggal_lahir", "2004-02-29");
  form.set("cv", new Blob(["document"], { type: "application/pdf" }), "cv.pdf");
  assert.deepEqual(validateOprecForm(fields, form), {});
  form.set("cv", new Blob(["script"]), "cv.exe"); assert.ok(validateOprecForm(fields, form).cv);
  form.set("cv", new Blob([new Uint8Array(1024 * 1024 + 1)]), "cv.pdf"); assert.ok(validateOprecForm(fields, form).cv);
});
test("posters reject unsafe URLs and dates display in WIB", () => {
  for (const url of ["javascript:alert(1)", "//evil.example", "/\\evil.example", "https://user:pass@example.com"]) assert.equal(safePosterUrl(url), null);
  assert.equal(safePosterUrl("/images/poster.webp"), "/images/poster.webp");
  assert.equal(safePosterUrl("https://example.com/poster.webp"), "https://example.com/poster.webp");
  assert.match(oprecDate("2026-10-01T18:00:00Z"), /2 Oktober 2026/);
});

test("conditional division questions only apply and validate when matching division is chosen", () => {
  const divisions = [
    { id: 1, nama: "BPH" },
    { id: 2, nama: "HUMAS" },
    { id: 3, nama: "KOMINFO" },
    { id: 4, nama: "PSDM" },
  ];
  const conditionalField = {
    name: "portofolio_kominfo",
    type: "text",
    label: "Link Portofolio Kominfo",
    required: true,
    target_type: "specific",
    target_divisions: ["KOMINFO"],
  };
  const fields = normalizeFields([
    ...identity,
    { name: "divisi_pilihan_1", type: "select", label: "Divisi", required: true, options: ["1", "2", "3", "4"] },
    conditionalField,
  ]);

  // When applicant selects BPH, HUMAS, PSDM (No KOMINFO)
  const formWithoutKominfo = new FormData();
  formWithoutKominfo.set("nim", "E312345");
  formWithoutKominfo.set("tanggal_lahir", "2004-01-01");
  formWithoutKominfo.set("divisi_pilihan_1", "1");
  formWithoutKominfo.set("jabatan_pilihan_1", "Sekretaris 2");
  formWithoutKominfo.set("divisi_pilihan_2", "2");
  formWithoutKominfo.set("divisi_pilihan_3", "4");
  // portofolio_kominfo is empty, but KOMINFO is not chosen -> passes validation!
  assert.equal(isFieldApplicable(fields.find(f => f.name === "portofolio_kominfo"), ["1", "2", "4"], divisions), false);
  assert.deepEqual(validateOprecForm(fields, formWithoutKominfo, Date.now(), divisions), {});

  // When applicant selects KOMINFO as choice 2
  const formWithKominfo = new FormData();
  formWithKominfo.set("nim", "E312345");
  formWithKominfo.set("tanggal_lahir", "2004-01-01");
  formWithKominfo.set("divisi_pilihan_1", "1");
  formWithKominfo.set("jabatan_pilihan_1", "Sekretaris 2");
  formWithKominfo.set("divisi_pilihan_2", "3");
  formWithKominfo.set("divisi_pilihan_3", "4");
  assert.equal(isFieldApplicable(fields.find(f => f.name === "portofolio_kominfo"), ["1", "3", "4"], divisions), true);
  // Empty -> error!
  const errors = validateOprecForm(fields, formWithKominfo, Date.now(), divisions);
  assert.ok(errors.portofolio_kominfo);

  // Filled -> passes!
  formWithKominfo.set("portofolio_kominfo", "https://github.com/my-portfolio");
  assert.deepEqual(validateOprecForm(fields, formWithKominfo, Date.now(), divisions), {});
});

test("link fields accept only clean http or https URLs", () => {
  const fields = normalizeFields([...identity, { name: "portofolio", type: "url", label: "Link portofolio", required: true }]);
  const form = new FormData();
  form.set("nim", "E312345");
  form.set("tanggal_lahir", "2004-01-01");
  form.set("portofolio", "javascript:alert(1)");
  assert.ok(validateOprecForm(fields, form).portofolio);
  form.set("portofolio", "https://user:pass@example.com");
  assert.ok(validateOprecForm(fields, form).portofolio);
  form.set("portofolio", "https://github.com/example/portfolio");
  assert.deepEqual(validateOprecForm(fields, form), {});
  assert.equal(validHttpUrl("https://drive.google.com/file/d/123"), true);
});
