import test from "node:test";
import assert from "node:assert/strict";
import { scoreTone, validScore } from "../src/lib/oprecAssessment.mjs";

test("warna skor mengikuti seluruh batas interval desimal", () => {
  for (const value of ["0", "1", "4,9"]) assert.match(scoreTone(value), /border-red-300/);
  for (const value of ["5", "7,5", "7,9"]) assert.match(scoreTone(value), /border-amber-300/);
  for (const value of ["8", "9,5", "9,9"]) assert.match(scoreTone(value), /border-green-300/);
  assert.match(scoreTone("10"), /border-blue-400/);
  assert.match(scoreTone(""), /border-slate-300/);
});

test("skor menerima koma atau titik dengan satu desimal tanpa membulatkan input tidak sah", () => {
  for (const value of ["", "0", "0,1", "7,5", "7.5", "9,9", "10", "10.0"]) assert.equal(validScore(value), true);
  for (const value of ["-1", "10,1", "7,25", "NaN", "1e1", " 7,5 "]) assert.equal(validScore(value), false);
});
