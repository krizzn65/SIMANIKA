"use client";

import { useSearchParams } from "next/navigation";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";

export default function ResetPasswordContent() {
  const params = useSearchParams();
  return <PasswordRecoveryForm mode="reset" token={params.get("token") || ""} email={params.get("email") || ""} />;
}
