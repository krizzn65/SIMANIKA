import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  timeout: 15000,
});

api.interceptors.response.use((response) => response, (error) => {
  if ([401, 419].includes(error.response?.status)) useAuthStore.getState().clear();
  const body = error.response?.data;
  const first = Object.values(body?.errors || {}).flat().find((value) => typeof value === "string");
  error.message = error.response?.status === 419
    ? "Sesi kedaluwarsa. Muat ulang halaman dan coba lagi."
    : first || body?.message || "Permintaan belum bisa diproses.";
  return Promise.reject(error);
});

export async function initCsrf() {
  if (!baseURL) throw new Error("Layanan akun belum dikonfigurasi.");
  await api.get(`${baseURL.replace(/\/api$/, "")}/sanctum/csrf-cookie`);
}
