"use client";

import { useEffect } from "react";
import { currentUser, login, logout, register } from "@/services/authClient";
import { useAuthStore } from "@/store/authStore";

let pendingProfile;

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const checked = useAuthStore((state) => state.checked);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    if (!checked) {
      pendingProfile ??= currentUser().finally(() => { pendingProfile = null; });
      pendingProfile.catch(clear);
    }
  }, [checked, clear]);

  return { user, checked, isAuthenticated, isAdmin, login, register, logout, refresh: currentUser };
}
