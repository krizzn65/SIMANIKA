"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { MaintenancePage } from "@/components/ui/404-page-not-found";

// Staff keep working during maintenance, and the sign-in pages stay open so they can.
const OPEN_PATHS = ["/login", "/admin", "/auth", "/forgot-password", "/reset-password", "/verify-email"];

function MaintenanceScreen({ message, children }) {
  const { checked, isAdmin } = useAuth();
  if (!checked) return null;
  return isAdmin ? children : <MaintenancePage message={message} />;
}

export function MaintenanceGate({ children }) {
  const pathname = usePathname() || "/";
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get("/public/status").then(({ data }) => setStatus(data?.data ?? null)).catch(() => setStatus(null));
  }, [pathname]);

  if (status?.maintenance && !OPEN_PATHS.some((path) => pathname.startsWith(path))) {
    return <MaintenanceScreen message={status.message}>{children}</MaintenanceScreen>;
  }
  return children;
}
