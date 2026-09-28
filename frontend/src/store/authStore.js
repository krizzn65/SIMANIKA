import { create } from "zustand";
import { STAFF_ROLES } from "@/lib/roleAccess";

export const useAuthStore = create((set) => ({
  user: null,
  checked: false,
  checkError: false,
  isAuthenticated: false,
  isAdmin: false,
  setUser: (user) => set({ user, checked: true, checkError: false, isAuthenticated: !!user, isAdmin: STAFF_ROLES.includes(user?.role) }),
  clear: () => set({ user: null, checked: true, checkError: false, isAuthenticated: false, isAdmin: false }),
  failCheck: () => set({ checked: true, checkError: true }),
  retryCheck: () => set({ checked: false, checkError: false }),
}));
