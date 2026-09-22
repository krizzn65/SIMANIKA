import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  checked: false,
  isAuthenticated: false,
  isAdmin: false,
  setUser: (user) => set({ user, checked: true, isAuthenticated: !!user, isAdmin: user?.role === "admin" }),
  clear: () => set({ user: null, checked: true, isAuthenticated: false, isAdmin: false }),
}));
