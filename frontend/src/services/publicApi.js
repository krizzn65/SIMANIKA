import axios from "axios";
import { hostingProtectionMessage, isHostingProtectionResponse } from "./apiError";
import { flushNetworkFailuresSoon, rememberNetworkFailure } from "./networkFailures";

const baseURL = (process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "")).replace(/\/+$/, "");

export const publicApi = axios.create({
  baseURL,
  headers: { Accept: "application/json" },
  timeout: 15000,
});

publicApi.interceptors.request.use((config) => {
  if (!baseURL) throw new Error("Alamat API publik belum dikonfigurasi pada build website.");
  return config;
});

publicApi.interceptors.response.use((response) => {
  if (isHostingProtectionResponse(response.data)) return Promise.reject(new Error(hostingProtectionMessage));
  flushNetworkFailuresSoon(response.config);
  return response;
}, (error) => {
  rememberNetworkFailure(error);
  if (isHostingProtectionResponse(error.response?.data)) error.message = hostingProtectionMessage;
  return Promise.reject(error);
});
