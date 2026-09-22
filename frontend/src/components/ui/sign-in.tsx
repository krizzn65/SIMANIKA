"use client";

import React, { useId, useState } from 'react';
import type { UseFormRegister } from 'react-hook-form';
import Link from 'next/link';
import './sign-in.css';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignInPageProps {
  fieldRegister?: UseFormRegister<{ email: string; password: string; rememberMe: boolean }>;
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  resetPasswordHref?: string;
  onCreateAccount?: () => void;
  backHref?: string;
  backLabel?: string;
  eyebrow?: React.ReactNode;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  rememberMeLabel?: string;
  submitLabel?: string;
  orContinueLabel?: string;
  googleLabel?: string;
  footerPrompt?: string;
  footerActionLabel?: string;
  createAccountHref?: string;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="simanika-glass-input">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay, isExtra = false }: { testimonial: Testimonial; delay: string; isExtra?: boolean }) => (
  <div className={`simanika-testimonial-card animate-testimonial ${delay} ${isExtra ? 'simanika-testimonial-card--extra' : ''} flex items-start gap-3 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="simanika-testimonial-avatar h-10 w-10 object-cover rounded-2xl" alt={testimonial.name} />
    <div className="simanika-testimonial-body text-sm leading-snug">
      <p className="simanika-testimonial-name flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="simanika-testimonial-handle text-muted-foreground">{testimonial.handle}</p>
      <p className="simanika-testimonial-text mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  fieldRegister,
  onGoogleSignIn,
  onResetPassword,
  resetPasswordHref = "/forgot-password",
  onCreateAccount,
  backHref = "/",
  backLabel = "Kembali ke Beranda",
  eyebrow,
  emailLabel = "Email",
  emailPlaceholder = "nama@email.com",
  passwordLabel = "Password",
  passwordPlaceholder = "Masukkan kata sandi...",
  rememberMeLabel = "Ingat saya di perangkat ini",
  submitLabel = "Masuk ke SIMANIKA",
  orContinueLabel = "Atau lanjutkan dengan",
  googleLabel = "Lanjutkan dengan Akun Google",
  footerPrompt = "Belum memiliki akun?",
  footerActionLabel = "Daftar di sini",
  createAccountHref = "/register",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const fieldId = useId();

  return (
    <div className="simanika-signin-root">
      {/* Left column: sign-in form */}
      <section className="simanika-signin-form-col flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Pixel mosaic corner decorations (top-left & bottom-left) */}
        <img
          src="/images/auth/pixel-corner-tl.svg"
          alt=""
          aria-hidden="true"
          className="simanika-pixel-corner simanika-pixel-corner--tl pointer-events-none select-none"
        />
        <img
          src="/images/auth/pixel-corner-bl.svg"
          alt=""
          aria-hidden="true"
          className="simanika-pixel-corner simanika-pixel-corner--bl pointer-events-none select-none"
        />

        <div className="simanika-signin-box w-full max-w-md relative z-10">
          {backHref && (
            <Link href={backHref} className="simanika-signin-brand-link">
              <svg className="simanika-signin-back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 12H4m0 0 6-6m-6 6 6 6" />
              </svg>
              <span>{backLabel}</span>
            </Link>
          )}

          <div className="flex flex-col gap-6">
            {eyebrow && <div className="animate-element animate-delay-100">{eyebrow}</div>}
            <h1 className="simanika-signin-title animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="simanika-signin-desc animate-element animate-delay-200 text-muted-foreground">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn} noValidate>
              <div className="simanika-form-group animate-element animate-delay-300">
                <label htmlFor={`${fieldId}-email`} className="simanika-form-label text-sm font-medium text-muted-foreground">{emailLabel}</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    {...fieldRegister?.("email")}
                    id={`${fieldId}-email`}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    type="email"
                    required
                    placeholder={emailPlaceholder}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="simanika-form-group animate-element animate-delay-400">
                <label htmlFor={`${fieldId}-password`} className="simanika-form-label text-sm font-medium text-muted-foreground">{passwordLabel}</label>
                <GlassInputWrapper>
                  <div className="relative w-full">
                    <input
                      name="password"
                      {...fieldRegister?.("password")}
                      id={`${fieldId}-password`}
                      autoComplete="current-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={passwordPlaceholder}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="simanika-input-toggle absolute inset-y-0 right-3 flex items-center"
                      data-visible={showPassword}
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                      aria-pressed={showPassword}
                    >
                      <svg className="simanika-animated-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path className="simanika-animated-eye__outline" d="M2.3 12s3.5-6 9.7-6 9.7 6 9.7 6-3.5 6-9.7 6-9.7-6-9.7-6Z" />
                        <circle className="simanika-animated-eye__pupil" cx="12" cy="12" r="3" />
                        <path className="simanika-animated-eye__slash" d="M3 21 21 3" />
                      </svg>
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="simanika-form-row animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="simanika-checkbox-label flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" {...fieldRegister?.("rememberMe")} className="custom-checkbox" />
                  <span className="text-foreground/90">{rememberMeLabel}</span>
                </label>
                <a
                  href={resetPasswordHref}
                  onClick={(e) => {
                    if (onResetPassword) {
                      e.preventDefault();
                      onResetPassword();
                    }
                  }}
                  className="simanika-link hover:underline text-violet-400 transition-colors"
                >
                  Lupa sandi?
                </a>
              </div>

              <button
                type="submit"
                className="simanika-btn-primary animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <span>{submitLabel}</span>
                <span className="simanika-btn-icon-slot" aria-hidden="true">
                  <svg
                    className="simanika-btn-icon simanika-btn-icon--primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12h16" />
                    <path d="m14 6 6 6-6 6" />
                  </svg>
                  <svg
                    className="simanika-btn-icon simanika-btn-icon--secondary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12h16" />
                    <path d="m14 6 6 6-6 6" />
                  </svg>
                </span>
              </button>
            </form>

            <div className="simanika-divider animate-element animate-delay-700 relative flex items-center justify-center">
              <span>{orContinueLabel}</span>
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              className="simanika-btn-social animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
            >
              <GoogleIcon />
              {googleLabel}
            </button>

            <p className="simanika-foot-note animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              {footerPrompt}{' '}
              <a
                href={createAccountHref}
                onClick={(e) => {
                  if (onCreateAccount) {
                    e.preventDefault();
                    onCreateAccount();
                  }
                }}
                className="simanika-link text-violet-400 hover:underline transition-colors"
              >
                {footerActionLabel}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="simanika-signin-hero-col hidden md:block flex-1 relative p-4">
          <div className="simanika-hero-stage animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl">
            <img
              className="simanika-hero-image"
              src={heroImageSrc}
              width={1122}
              height={1402}
              alt="Minka, maskot HIMANIKA, menyambut pengunjung"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {testimonials.length > 0 && (
              <div className="simanika-testimonials-wrap absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
                <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
                {testimonials[1] && <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" isExtra={true} />}
                {testimonials[2] && <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" isExtra={true} />}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default SignInPage;
