import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const source = await readFile(new URL("../src/lib/roleAccess.js", import.meta.url), "utf8");
const { canAccessAdminPath } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

test("Pengurus sees summaries and assessment but cannot enter OPREC editors", () => {
  for (const path of ["/admin/oprec", "/admin/oprec/test", "/admin/oprec/penilaian", "/admin/oprec/pengumuman"]) {
    assert.equal(canAccessAdminPath("leader", path), true);
    assert.equal(canAccessAdminPath("leader", path + "/"), true);
    assert.equal(canAccessAdminPath("user", path), false);
  }
  for (const path of ["/admin/oprec/create", "/admin/oprec/edit", "/admin/oprec/test/edit"]) {
    assert.equal(canAccessAdminPath("leader", path), false);
    assert.equal(canAccessAdminPath("admin", path), true);
    assert.equal(canAccessAdminPath("super_admin", path), true);
  }
});

test("only Super Admin can open system logs", () => {
  assert.equal(canAccessAdminPath("super_admin", "/admin/logs"), true);
  for (const role of ["admin", "leader", "kwu", "user"]) {
    assert.equal(canAccessAdminPath(role, "/admin/logs"), false);
  }
});
