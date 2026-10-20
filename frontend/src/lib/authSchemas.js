import { z } from "zod";

const email = z.string().trim().email("Masukkan alamat email yang valid.").max(254);
const password = z.string().min(8, "Kata sandi minimal 8 karakter.").max(1024);
const nama = z.string().trim().max(150, "Nama maksimal 150 karakter.").optional().or(z.literal(""));

export const loginSchema = z.object({ email, password: z.string().min(1, "Masukkan kata sandi."), rememberMe: z.boolean() });
export const registerSchema = z.object({ nama, email, password, passwordConfirmation: z.string().min(1, "Ulangi kata sandi.") })
  .refine((data) => data.password === data.passwordConfirmation, { message: "Konfirmasi kata sandi tidak sama.", path: ["passwordConfirmation"] });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ email, password, token: z.string().min(1) });
