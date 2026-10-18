import axios from "axios";
import { apiErrorMessage } from "./apiError";
import { useAuthStore } from "@/store/authStore";

const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  config.authEpoch ??= useAuthStore.getState().authEpoch;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && error.config?.authEpoch === useAuthStore.getState().authEpoch) {
    const wasAuth = useAuthStore.getState().isAuthenticated;
    const isRemembered = typeof window !== "undefined" && localStorage.getItem("simanika_remember_me") === "true";
    if (wasAuth && !isRemembered) {
      useAuthStore.getState().setSessionExpired(true);
    }
    useAuthStore.getState().clear();
  }
  error.message = apiErrorMessage(error);
  return Promise.reject(error);
});

export async function initCsrf() {
  if (!baseURL) throw new Error("Layanan akun belum dikonfigurasi.");
  await api.get(`${baseURL.replace(/\/api$/, "")}/sanctum/csrf-cookie`);
}
