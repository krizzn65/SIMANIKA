import RegisterForm from "@/components/auth/RegisterForm";
import "./register.css";

export const metadata = {
  title: "Buat Akun — SIMANIKA",
  description: "Buat akun SIMANIKA untuk mengikuti kegiatan HIMANIKA.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
