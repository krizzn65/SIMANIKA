import axios from "axios";
import { apiErrorMessage, hostingProtectionMessage, isHostingProtectionResponse } from "./apiError";
import { useAuthStore } from "@/store/authStore";

const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "")).replace(/\/+$/, "");

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
  if (!baseURL) throw new Error("Alamat API publik belum dikonfigurasi pada build website.");
  config.authEpoch ??= useAuthStore.getState().authEpoch;
  return config;
});

api.interceptors.response.use((response) => {
  if (isHostingProtectionResponse(response.data)) return Promise.reject(new Error(hostingProtectionMessage));
  return response;
}, (error) => {
  if (isHostingProtectionResponse(error.response?.data)) {
    error.message = hostingProtectionMessage;
    return Promise.reject(error);
  }
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
  const origin = new URL(baseURL, window.location.origin).origin;
  await api.get(`${origin}/sanctum/csrf-cookie`);
}
