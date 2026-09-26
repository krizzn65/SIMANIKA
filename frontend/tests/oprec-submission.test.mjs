import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const source = await readFile(new URL("../src/lib/oprec.js", import.meta.url), "utf8");
const lib = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const service = (await readFile(new URL("../src/services/oprecSubmission.js", import.meta.url), "utf8")).replace(/^import .*;\n/gm, "").replaceAll("export ", "");
const period = lib.normalizeOprec({ id: 1, periode: "Test", status: "open", tanggalBuka: "2000-01-01T00:00:00Z", tanggalTutup: "2099-01-01T00:00:00Z", divisiTersedia: [{ id: 1, nama: "Kominfo" }], schemaVersion: "v2", formFields: [{ name: "nim", type: "text", label: "NIM", required: true }, { name: "tanggal_lahir", type: "date", label: "Lahir", required: true }] });
function handlers(oprec, upstream) {
  return new Function("getOprec", "oprecState", "validBirthDate", "validateOprecForm", "fetch", "process", `${service}\nreturn {registerOprec, lookupOprecResult};`)(async () => oprec, lib.oprecState, lib.validBirthDate, lib.validateOprecForm, upstream, { env: { API_BASE_URL: "https://backend.test/api" } });
}
function registration(version = "v2") {
  const form = new FormData();
  for (const [key, value] of Object.entries({ oprec_id: "1", schema_version: version, nim: "E12345", tanggal_lahir: "2004-02-29", ignored: "private-extra" })) form.set(key, value);
  return new Request("https://site.test/api/oprec/register", { method: "POST", body: form });
}
function lookup() {
  return new Request("https://site.test/api/oprec/result", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oprec_id: "1", nim: "E12345", tanggal_lahir: "2004-02-29" }) });
}
test("registration forwards only approved schema fields and confirms persisted success", async () => {
  const { registerOprec } = handlers(period, async (url, options) => {
    assert.match(url, /\/user\/oprec\/register$/);
    assert.equal(options.body.get("ignored"), null);
    assert.equal(options.body.get("nim"), "E12345");
    return Response.json({ data: { submitted: true, private: "ignored" } });
  });
  const response = await registerOprec(registration());
  assert.equal(response.status, 201);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.deepEqual((await response.json()).data, { submitted: true });
});
test("registration forwards exactly three ranked division choices", async () => {
  const divisionPeriod = lib.normalizeOprec({ id: 2, periode: "Three", status: "open", tanggalBuka: "2000-01-01T00:00:00Z", tanggalTutup: "2099-01-01T00:00:00Z", schemaVersion: "1", divisiTersedia: [{ id: 1, nama: "BPH" }, { id: 2, nama: "Humas" }, { id: 3, nama: "PSDM" }], formFields: [...period.formFields, { name: "divisi_pilihan_1", type: "select", label: "Divisi pilihan", required: true }] });
  const submit = handlers(divisionPeriod, async (_url, options) => {
    assert.deepEqual([1, 2, 3].map((rank) => options.body.get(`divisi_pilihan_${rank}`)), ["1", "2", "3"]);
    return Response.json({ data: { submitted: true } });
  }).registerOprec;
  const form = new FormData();
  for (const [key, value] of Object.entries({ oprec_id: "2", schema_version: "1", nim: "E12345", tanggal_lahir: "2004-02-29", divisi_pilihan_1: "1", divisi_pilihan_2: "2" })) form.set(key, value);
  const request = () => new Request("https://site.test/api/oprec/register", { method: "POST", body: form });
  assert.equal((await submit(request())).status, 422);
  form.set("divisi_pilihan_3", "3");
  assert.equal((await submit(request())).status, 201);
});
test("closed period and stale schema reject before forwarding", async () => {
  const upstream = async () => { throw new Error("must not forward"); };
  assert.equal((await handlers({ ...period, status: "closed" }, upstream).registerOprec(registration())).status, 409);
  assert.equal((await handlers(period, upstream).registerOprec(registration("old"))).status, 409);
});
test("unpublished announcements cannot be searched", async () => {
  const response = await handlers(period, async () => { throw new Error("must not forward"); }).lookupOprecResult(lookup());
  assert.equal(response.status, 409);
});
test("private selection response is reduced to status, division and message", async () => {
  const announced = { ...period, status: "closed", pengumuman: { published: true, tanggal: null } };
  const { lookupOprecResult } = handlers(announced, async (_url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(JSON.parse(options.body).tanggal_lahir, "2004-02-29");
    return Response.json({ data: { status: "accepted", divisi: "Kominfo", pesan: "Selamat", nim: "E12345", tanggal_lahir: "2004-02-29", email: "private@example.com" } });
  });
  const response = await lookupOprecResult(lookup());
  assert.deepEqual((await response.json()).data, { status: "accepted", divisi: "Kominfo", pesan: "Selamat" });
  assert.match(response.headers.get("cache-control"), /no-store/);
});
test("upstream failure never becomes rejection or a fake success", async () => {
  const announced = { ...period, status: "closed", pengumuman: { published: true, tanggal: null } };
  assert.equal((await handlers(announced, async () => new Response("", { status: 404 })).lookupOprecResult(lookup())).status, 503);
  assert.equal((await handlers(period, async () => Response.json({})).registerOprec(registration())).status, 503);
  assert.equal((await handlers(announced, async () => new Response("", { status: 429 })).lookupOprecResult(lookup())).status, 429);
});
test("cross-origin result requests are rejected", async () => {
  const request = lookup(); request.headers.set("origin", "https://other.test");
  const response = await handlers(period, async () => { throw new Error("must not forward"); }).lookupOprecResult(request);
  assert.equal(response.status, 403);
});
