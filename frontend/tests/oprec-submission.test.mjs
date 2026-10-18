import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { NextResponse } from "next/server.js";
const source = await readFile(new URL("../src/lib/oprec.js", import.meta.url), "utf8");
const lib = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const service = (await readFile(new URL("../src/services/oprecSubmission.js", import.meta.url), "utf8")).replace(/^import .*;\n/gm, "").replaceAll("export ", "");
const period = lib.normalizeOprec({ id: 1, periode: "Test", status: "open", tanggalBuka: "2000-01-01T00:00:00Z", tanggalTutup: "2099-01-01T00:00:00Z", divisiTersedia: [{ id: 1, nama: "Kominfo" }, { id: 2, nama: "Humas" }, { id: 3, nama: "PSDM" }], schemaVersion: "v2", formFields: [{ name: "nim", type: "text", label: "NIM", required: true }, { name: "tanggal_lahir", type: "date", label: "Lahir", required: true }] });
function handlers(oprec, upstream) {
  return new Function("getOprec", "OPREC_REQUIRED_CONSENTS", "normalizeOprecNim", "oprecState", "validBirthDate", "validateOprecForm", "validateOprecConsents", "isFieldApplicable", "fetch", "process", "NextResponse", `${service}\nreturn {registerOprec, lookupOprecResult};`)(async () => oprec, lib.OPREC_REQUIRED_CONSENTS, lib.normalizeOprecNim, lib.oprecState, lib.validBirthDate, lib.validateOprecForm, lib.validateOprecConsents, lib.isFieldApplicable, upstream, { env: { API_BASE_URL: "https://backend.test/api" } }, NextResponse);
}
function registration(version = "v2") {
  const form = new FormData();
  for (const [key, value] of Object.entries({ oprec_id: "1", schema_version: version, nim: "e312345", tanggal_lahir: "2004-02-29", divisi_pilihan_1: "1", divisi_pilihan_2: "2", divisi_pilihan_3: "3", persetujuan_data_benar: "on", persetujuan_penggunaan_data: "on", ignored: "private-extra" })) form.set(key, value);
  return new Request("https://site.test/api/oprec/register", { method: "POST", body: form });
}
function lookup() {
  return new Request("https://site.test/api/oprec/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oprec_id: "1", nim: "E312345", tanggal_lahir: "2004-02-29" }) });
}
test("registration drops answers for divisions the participant did not choose", async () => {
  const conditional = { ...period, formFields: [...period.formFields, { name: "hidden_file", type: "file", label: "Berkas Ristek", required: true, targetType: "specific", targetDivisions: ["Ristek"] }] };
  const form = await registration().formData();
  ["1", "2", "3"].forEach((id, index) => form.set(`divisi_pilihan_${index + 1}`, id));
  form.set("hidden_file", "unvalidated-value");
  const response = await handlers(conditional, async (_url, options) => {
    assert.equal(options.body.get("hidden_file"), null);
    return Response.json({ data: { submitted: true } });
  }).registerOprec(new Request("https://site.test/api/oprec/register", { method: "POST", body: form }));
  assert.equal(response.status, 201);
});
test("registration rejects missing division choices even without a legacy division field", async () => {
  const form = await registration().formData();
  [1, 2, 3].forEach(rank => form.delete(`divisi_pilihan_${rank}`));
  const response = await handlers(period, async () => { throw Error('must not forward'); })
    .registerOprec(new Request("https://site.test/api/oprec/register", { method: "POST", body: form }));
  assert.equal(response.status, 422);
  assert.ok((await response.json()).errors.divisi_pilihan_1);
});
test("registration handles session expiry, validation, rate limits and timeout without fake success", async () => {
  for (const [upstreamStatus, expected] of [[401, 401], [419, 401], [422, 422], [429, 429], [500, 503]]) {
    const response = await handlers(period, async () => Response.json({ errors: { nim: ['Periksa NIM'] } }, { status: upstreamStatus }))
      .registerOprec(registration());
    assert.equal(response.status, expected);
    assert.notEqual((await response.json()).data?.submitted, true);
  }
  let attempts = 0;
  const response = await handlers(period, async () => { attempts++; throw new DOMException('Timed out', 'TimeoutError'); }).registerOprec(registration());
  assert.equal(response.status, 503);
  assert.equal(attempts, 1);
});
test("registration forwards only approved schema fields and confirms persisted success", async () => {
  const { registerOprec } = handlers(period, async (url, options) => {
    assert.match(url, /\/user\/oprec\/register$/);
    assert.equal(options.body.get("ignored"), null);
    assert.equal(options.body.get("nim"), "E312345");
    return Response.json({ data: { submitted: true, private: "ignored" } });
  });
  const response = await registerOprec(registration());
  assert.equal(response.status, 201);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual((await response.json()).data, { submitted: true });
});
test("registration rejects non-E31 NIM before forwarding", async () => {
  const request = registration();
  const body = await request.formData();
  body.set("nim", "E12345");
  const forged = new Request(request.url, { method: "POST", body });
  const response = await handlers(period, async () => { throw new Error("must not forward"); }).registerOprec(forged);
  assert.equal(response.status, 422);
  assert.equal((await response.json()).errors.nim, "NIM tidak valid.");
});
test("registration forwards exactly three ranked division choices", async () => {
  const divisionPeriod = lib.normalizeOprec({ id: 2, periode: "Three", status: "open", tanggalBuka: "2000-01-01T00:00:00Z", tanggalTutup: "2099-01-01T00:00:00Z", schemaVersion: "1", divisiTersedia: [{ id: 1, nama: "BPH" }, { id: 2, nama: "Humas" }, { id: 3, nama: "PSDM" }], formFields: [...period.formFields, { name: "divisi_pilihan_1", type: "select", label: "Divisi pilihan", required: true }] });
  const submit = handlers(divisionPeriod, async (_url, options) => {
    assert.deepEqual([1, 2, 3].map((rank) => options.body.get(`divisi_pilihan_${rank}`)), ["1", "2", "3"]);
    return Response.json({ data: { submitted: true } });
  }).registerOprec;
  const form = new FormData();
  for (const [key, value] of Object.entries({ oprec_id: "2", schema_version: "1", nim: "E312345", tanggal_lahir: "2004-02-29", divisi_pilihan_1: "1", divisi_pilihan_2: "2", persetujuan_data_benar: "on", persetujuan_penggunaan_data: "on" })) form.set(key, value);
  const request = () => new Request("https://site.test/api/oprec/register", { method: "POST", body: form });
  assert.equal((await submit(request())).status, 422);
  form.set("divisi_pilihan_3", "3");
  assert.equal((await submit(request())).status, 422);
  form.set("jabatan_pilihan_1", "Sekretaris 2");
  assert.equal((await submit(request())).status, 201);
});
test("closed period and stale schema reject before forwarding", async () => {
  const upstream = async () => { throw new Error("must not forward"); };
  assert.equal((await handlers({ ...period, status: "closed" }, upstream).registerOprec(registration())).status, 409);
  assert.equal((await handlers(period, upstream).registerOprec(registration("old"))).status, 409);
});
test("unpublished announcements cannot be searched", async () => {
  const response = await handlers(period, async () => new Response("", { status: 409 })).lookupOprecResult(lookup());
  assert.equal(response.status, 409);
});
test("result ticket is stored only in a scoped HttpOnly cookie", async () => {
  const announced = { ...period, status: "closed", pengumuman: { published: true, tanggal: null } };
  const { lookupOprecResult } = handlers(announced, async (_url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(JSON.parse(options.body).tanggal_lahir, "2004-02-29");
    return Response.json({ ticket: "encrypted-ticket", expires_in: 1800 });
  });
  const response = await lookupOprecResult(lookup());
  assert.deepEqual(await response.json(), { verified: true });
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /Path=\/oprec\/pengumuman\/1/);
  assert.match(response.headers.get("cache-control"), /no-store/);
});
test("result lookup normalizes lowercase NIM before forwarding", async () => {
  const announced = { ...period, status: "closed", pengumuman: { published: true, tanggal: null } };
  const request = new Request("https://site.test/api/oprec/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oprec_id: "1", nim: " e312345 ", tanggal_lahir: "2004-02-29" }) });
  const response = await handlers(announced, async (_url, options) => {
    assert.equal(JSON.parse(options.body).nim, "E312345");
    return Response.json({ ticket: "encrypted-ticket", expires_in: 1800 });
  }).lookupOprecResult(request);
  assert.equal(response.status, 200);
});
test("upstream failure never becomes rejection or a fake success", async () => {
  const announced = { ...period, status: "closed", pengumuman: { published: true, tanggal: null } };
  assert.equal((await handlers(announced, async () => new Response("", { status: 404 })).lookupOprecResult(lookup())).status, 404);
  assert.equal((await handlers(period, async () => Response.json({})).registerOprec(registration())).status, 503);
  assert.equal((await handlers(announced, async () => new Response("", { status: 429 })).lookupOprecResult(lookup())).status, 429);
});
test("cross-origin result requests are rejected", async () => {
  const request = lookup(); request.headers.set("origin", "https://other.test");
  const response = await handlers(period, async () => { throw new Error("must not forward"); }).lookupOprecResult(request);
  assert.equal(response.status, 403);
});
