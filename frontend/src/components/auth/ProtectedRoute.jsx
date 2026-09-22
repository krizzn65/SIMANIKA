"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children, admin = false }) {
  const { checked, checkError, retryCheck, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!checked || checkError) return;
    if (!isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (admin && !isAdmin) router.replace("/");
  }, [checked, checkError, isAuthenticated, isAdmin, admin, pathname, router]);

  if (checkError) return <div role="alert">Sesi akun belum dapat diperiksa. <button type="button" onClick={retryCheck}>Coba lagi</button></div>;
  if (!checked || !isAuthenticated || (admin && !isAdmin)) return null;
  return children;
}
