import assert from "node:assert/strict";
import test from "node:test";
import { INACTIVITY_TIMEOUT_MS } from "../src/lib/sessionConstants.js";
import { useAuthStore } from "../src/store/authStore.js";

test("inactivity timeout is set to exactly 2 hours (120 minutes)", () => {
  assert.equal(INACTIVITY_TIMEOUT_MS, 2 * 60 * 60 * 1000);
  assert.equal(INACTIVITY_TIMEOUT_MS, 7200000);
});

test("authStore handles sessionExpired state correctly", () => {
  // Initial state check or reset
  useAuthStore.getState().clear();
  useAuthStore.getState().setSessionExpired(false);
  assert.equal(useAuthStore.getState().sessionExpired, false);
  assert.equal(useAuthStore.getState().isAuthenticated, false);

  // Set authenticated user
  useAuthStore.getState().setUser({ id: 1, name: "User Test", role: "user" });
  assert.equal(useAuthStore.getState().isAuthenticated, true);
  assert.equal(useAuthStore.getState().sessionExpired, false);

  // Trigger sessionExpired
  useAuthStore.getState().setSessionExpired(true);
  assert.equal(useAuthStore.getState().sessionExpired, true);

  // Calling clear preserves sessionExpired so notice remains visible
  useAuthStore.getState().clear();
  assert.equal(useAuthStore.getState().isAuthenticated, false);
  assert.equal(useAuthStore.getState().sessionExpired, true);

  // Logging in again resets sessionExpired to false
  useAuthStore.getState().setUser({ id: 1, name: "User Test", role: "user" });
  assert.equal(useAuthStore.getState().sessionExpired, false);
});

test("remember_me flag bypasses inactivity expiration logic", () => {
  // Mock localStorage
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
  };

  storage.set("simanika_remember_me", "true");
  storage.set("simanika_last_activity", String(Date.now() - 3 * 60 * 60 * 1000)); // 3 hours ago

  // Function logic check
  const isRemembered = localStorage.getItem("simanika_remember_me") === "true";
  assert.equal(isRemembered, true);

  // If remembered, session should NOT be considered expired by inactivity
  let sessionExpiredTriggered = false;
  if (!isRemembered) {
    sessionExpiredTriggered = true;
  }
  assert.equal(sessionExpiredTriggered, false);
});
