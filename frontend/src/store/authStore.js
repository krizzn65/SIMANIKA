import { create } from "zustand";
import { STAFF_ROLES } from "../lib/roleAccess.js";

export const useAuthStore = create((set) => ({
  user: null,
  checked: false,
  checkError: false,
  isAuthenticated: false,
  isAdmin: false,
  sessionExpired: false,
  authEpoch: 0,
  setUser: (user) => set((state) => ({ user, checked: true, checkError: false, isAuthenticated: !!user, isAdmin: STAFF_ROLES.includes(user?.role), sessionExpired: false, authEpoch: state.authEpoch + 1 })),
  clear: () => set((state) => ({ user: null, checked: true, checkError: false, isAuthenticated: false, isAdmin: false, authEpoch: state.authEpoch + 1 })),
  setSessionExpired: (sessionExpired) => set({ sessionExpired }),
  failCheck: () => set({ checked: true, checkError: true }),
  retryCheck: () => set({ checked: false, checkError: false }),
}));
