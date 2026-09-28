"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAccessAdminPath } from "@/lib/roleAccess";

export function AdminRoute({ children }) {
  const pathname = usePathname();
  const { user } = useAuth();
  return <ProtectedRoute admin>{canAccessAdminPath(user?.role, pathname) ? children : null}</ProtectedRoute>;
}
