"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CircleAlert, Info, LoaderCircle, X } from "lucide-react";
import "./auth-feedback.css";

const toastCopy = {
  loading: { label: "Sedang diproses", Icon: LoaderCircle },
  success: { label: "Berhasil", Icon: Check },
  error: { label: "Belum berhasil", Icon: CircleAlert },
  info: { label: "Info", Icon: Info },
};

export function AuthFeedbackToast({ status = "idle", message, onDismiss }) {
  const reduced = useReducedMotion();
  const visible = status !== "idle" && Boolean(message);
  const copy = toastCopy[status] || toastCopy.info;
  const Icon = copy.Icon;
  const isProcessing = status === "loading";

  return (
    <div
      className={`simanika-auth-toast-wrap${isProcessing ? " simanika-auth-toast-wrap--processing" : ""}`}
      aria-live={status === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <AnimatePresence initial={!reduced} mode="wait">
        {visible && (
          <motion.div
            key={`${status}-${message}`}
            className={`simanika-auth-toast simanika-auth-toast--${status}`}
            role={status === "error" ? "alert" : "status"}
            initial={reduced ? false : isProcessing ? { opacity: 0, y: 14, scale: 0.96 } : { opacity: 0, y: -12, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : isProcessing ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: reduced ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {isProcessing ? (
              <>
                <span className="simanika-auth-toast__icon simanika-auth-toast__icon--large" aria-hidden="true">
                  <LoaderCircle className="simanika-auth-toast__spinner" size={22} strokeWidth={2.2} />
                  <span className="simanika-auth-toast__orbit" />
                </span>
                <span className="simanika-auth-toast__body">
                  <strong>{copy.label}</strong>
                  <span>{message}</span>
                  <span className="simanika-auth-toast__progress" aria-hidden="true"><i /></span>
                </span>
              </>
            ) : (
              <>
                <span className="simanika-auth-toast__icon" aria-hidden="true">
                  <Icon size={17} strokeWidth={2.2} />
                  <span className="simanika-auth-toast__signal" />
                </span>
                <span className="simanika-auth-toast__body">
                  <strong>{copy.label}</strong>
                  <span>{message}</span>
                </span>
                {onDismiss && (
                  <button type="button" className="simanika-auth-toast__close" onClick={onDismiss} aria-label="Tutup notifikasi">
                    <X size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AuthFeedbackToast;
