import axios from "axios";
import { apiErrorMessage } from "./apiError";
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
  if (error.response?.status === 401) useAuthStore.getState().clear();
  error.message = apiErrorMessage(error);
  return Promise.reject(error);
});

export async function initCsrf() {
  if (!baseURL) throw new Error("Layanan akun belum dikonfigurasi.");
  await api.get(`${baseURL.replace(/\/api$/, "")}/sanctum/csrf-cookie`);
}
