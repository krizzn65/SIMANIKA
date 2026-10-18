import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";
import "../register/register.css";
import "./recovery.css";

export const metadata = {
  title: "Atur Ulang Sandi — SIMANIKA",
  description: "Atur kata sandi baru untuk akun SIMANIKA.",
};

export default function ResetPasswordPage() {
  return <Suspense fallback={<p>Memuat halaman reset sandi...</p>}><ResetPasswordContent /></Suspense>;
}
