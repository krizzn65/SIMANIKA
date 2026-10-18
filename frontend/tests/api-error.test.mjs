import assert from "node:assert/strict";
import test from "node:test";
import { apiErrorMessage, isHostingProtectionResponse } from "../src/services/apiError.js";

test("API errors never expose SQL or stack traces", () => {
  const error = { response: { status: 500, data: { message: 'SQLSTATE[42703]: column "guidebook_type" does not exist', exception: "QueryException" } } };
  assert.match(apiErrorMessage(error), /Layanan sedang bermasalah/);
  assert.doesNotMatch(apiErrorMessage(error), /SQLSTATE|guidebook_type/);
});

test("validation and session errors remain actionable", () => {
  assert.equal(apiErrorMessage({ response: { status: 422, data: { errors: { judul: ["Judul wajib diisi."] } } } }), "Judul wajib diisi.");
  assert.match(apiErrorMessage({ response: { status: 419 } }), /Sesi kedaluwarsa/);
  assert.match(apiErrorMessage({ response: { status: 422, data: { errors: { judul: ["SQLSTATE[42703] invalid"] } } } }), /Data belum valid/);
});

test("HTTP 200 from hosting bot protection is rejected as a blocked request", () => {
  assert.equal(isHostingProtectionResponse({ message: "Access denied by Imunify360 bot-protection. IPs used for automation should be whitelisted" }), true);
  assert.equal(isHostingProtectionResponse("<html><h1>Please wait while your request is being verified...</h1></html>"), true);
  assert.equal(isHostingProtectionResponse({ data: { emailVerifiedAt: null } }), false);
});
