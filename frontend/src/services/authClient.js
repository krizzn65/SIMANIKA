import { api, initCsrf } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export async function login(email, password, remember = false) {
  await initCsrf();
  const { data } = await api.post("/auth/login", { email, password, remember });
  let profile;
  try {
    profile = await api.get("/auth/me");
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Login diterima, tetapi sesi tidak tersimpan di browser. Periksa alamat situs dan cookie, lalu coba lagi.");
    }
    throw error;
  }
  if (!profile.data?.data) throw new Error("Sesi akun belum dapat diverifikasi. Silakan coba masuk kembali.");
  useAuthStore.getState().setUser(profile.data.data);
  if (typeof window !== "undefined") {
    localStorage.setItem("simanika_last_activity", String(Date.now()));
    localStorage.removeItem("simanika_session_expired");
    if (remember) {
      localStorage.setItem("simanika_remember_me", "true");
    } else {
      localStorage.removeItem("simanika_remember_me");
    }
  }
  return data;
}

export async function register(email, password, nama = "") {
  await initCsrf();
  const payload = { email, password };
  if (nama) {
    payload.nama = nama;
    payload.name = nama;
  }
  const { data } = await api.post("/auth/register", payload);
  useAuthStore.getState().setUser(data.data);
  if (typeof window !== "undefined") {
    localStorage.setItem("simanika_last_activity", String(Date.now()));
    localStorage.removeItem("simanika_session_expired");
  }
  return data;
}

export async function currentUser() {
  const authEpoch = useAuthStore.getState().authEpoch;
  const { data } = await api.get("/auth/me", { authEpoch });
  if (authEpoch !== useAuthStore.getState().authEpoch) return data;
  useAuthStore.getState().setUser(data.data);
  if (typeof window !== "undefined" && data.data) {
    if (!localStorage.getItem("simanika_last_activity")) {
      localStorage.setItem("simanika_last_activity", String(Date.now()));
    }
  }
  return data;
}

export async function logout() {
  try {
    await initCsrf();
    const { data } = await api.post("/auth/logout");
    useAuthStore.getState().clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("simanika_last_activity");
      localStorage.removeItem("simanika_session_expired");
      localStorage.removeItem("simanika_remember_me");
    }
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      useAuthStore.getState().clear();
      if (typeof window !== "undefined") {
        localStorage.removeItem("simanika_last_activity");
        localStorage.removeItem("simanika_session_expired");
        localStorage.removeItem("simanika_remember_me");
      }
      return { message: "Sesi sudah berakhir." };
    }
    throw error;
  }
}

export function getGoogleAuthUrl() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api").replace(/\/+$/, "");
  return `${base}/auth/google/redirect`;
}
