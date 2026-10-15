"use client";

import { useEffect } from "react";
import { currentUser, login, logout, register } from "@/services/authClient";
import { useAuthStore } from "@/store/authStore";

let pendingProfile;

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const checked = useAuthStore((state) => state.checked);
  const checkError = useAuthStore((state) => state.checkError);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const failCheck = useAuthStore((state) => state.failCheck);
  const retryCheck = useAuthStore((state) => state.retryCheck);

  useEffect(() => {
    if (!checked) {
      pendingProfile ??= currentUser().finally(() => { pendingProfile = null; });
      pendingProfile.catch((error) => {
        if (error.response?.status === 401) return;
        if (!useAuthStore.getState().checked) failCheck();
      });
    }
  }, [checked, failCheck]);

  return { user, checked, checkError, isAuthenticated, isAdmin, login, register, logout, refresh: currentUser, retryCheck };
}
