"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children, admin = false }) {
  const { checked, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (admin && !isAdmin) router.replace("/");
  }, [checked, isAuthenticated, isAdmin, admin, pathname, router]);

  if (!checked || !isAuthenticated || (admin && !isAdmin)) return null;
  return children;
}
