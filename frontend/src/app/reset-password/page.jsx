import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";
import "../register/register.css";
import "./recovery.css";

export const metadata = {
  title: "Atur Ulang Sandi — SIMANIKA",
  description: "Atur kata sandi baru untuk akun SIMANIKA.",
};

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";
  const email = typeof params?.email === "string" ? params.email : "";
  return <PasswordRecoveryForm mode="reset" token={token} email={email} />;
}
