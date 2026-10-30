import axios from "axios";

// Requests that get no answer at all never reach the server's log. Keep a short
// note in the browser and send it once a later request succeeds.
const STORAGE_KEY = "simanika_network_failures";
export const REPORT_PATH = "/public/client-errors";
let flushing = false;

export function rememberNetworkFailure(error) {
  const config = error?.config || {};
  if (error?.response || axios.isCancel(error) || error?.code === "ERR_CANCELED" || config.url === REPORT_PATH) return;
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    list.push({
      at: new Date().toISOString(),
      page: window.location.pathname.slice(0, 200),
      endpoint: String(config.url || "").split("?")[0].slice(0, 200),
      method: String(config.method || "get").toUpperCase(),
      error: String(error?.code || "NETWORK").slice(0, 60),
      online: navigator.onLine,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-20)));
  } catch {}
}

export function flushNetworkFailuresSoon(config) {
  if (config?.url === REPORT_PATH) return;
  window.setTimeout(flush, 0);
}

async function flush() {
  if (flushing) return;
  let reports;
  try { reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return; }
  if (!reports.length) return;
  flushing = true;
  try {
    const { api, initCsrf } = await import("./api");
    await initCsrf();
    await api.post(REPORT_PATH, { reports });
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Kept for the next successful request.
  } finally { flushing = false; }
}
