import { api, initCsrf } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export async function login(email, password, remember = false) {
  await initCsrf();
  const { data } = await api.post("/auth/login", { email, password, remember });
  useAuthStore.getState().setUser(data.data);
  return data;
}

export async function register(email, password) {
  await initCsrf();
  const { data } = await api.post("/auth/register", { email, password });
  useAuthStore.getState().setUser(data.data);
  return data;
}

export async function currentUser() {
  const { data } = await api.get("/auth/me");
  useAuthStore.getState().setUser(data.data);
  return data;
}

export async function logout() {
  await initCsrf();
  const { data } = await api.post("/auth/logout");
  useAuthStore.getState().clear();
  return data;
}

export function getGoogleAuthUrl() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "");
  return `${base}/auth/google/redirect`;
}

