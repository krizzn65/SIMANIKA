import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";
import "../register/register.css";
import "../reset-password/recovery.css";

export const metadata = {
  title: "Lupa Sandi — SIMANIKA",
  description: "Minta tautan untuk mengatur ulang kata sandi SIMANIKA.",
};

export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm mode="forgot" />;
}
