import { create } from "zustand";
import { STAFF_ROLES } from "../lib/roleAccess.js";

export const useAuthStore = create((set) => ({
  user: null,
  checked: false,
  checkError: false,
  isAuthenticated: false,
  isAdmin: false,
  sessionExpired: false,
  setUser: (user) => set({ user, checked: true, checkError: false, isAuthenticated: !!user, isAdmin: STAFF_ROLES.includes(user?.role), sessionExpired: false }),
  clear: () => set({ user: null, checked: true, checkError: false, isAuthenticated: false, isAdmin: false }),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  failCheck: () => set({ checked: true, checkError: true }),
  retryCheck: () => set({ checked: false, checkError: false }),
}));
