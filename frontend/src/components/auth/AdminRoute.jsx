"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export function AdminRoute({ children }) {
  return <ProtectedRoute admin>{children}</ProtectedRoute>;
}
