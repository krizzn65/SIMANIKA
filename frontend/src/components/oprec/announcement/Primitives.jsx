"use client";

// Adapted from shadcn/ui components distributed on 21st.dev. See SOURCES.md.
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import "./announcement.css";
import { useScrollLock } from "@/components/motion/SmoothScroll";

export function Button({ variant = "primary", className = "", type = "button", ...props }) {
  return <button type={type} className={`oa-button oa-button--${variant} ${className}`} {...props} />;
}
export function Input({ className = "", ...props }) {
  return <input className={`oa-input ${className}`} {...props} />;
}
export function Textarea({ className = "", ...props }) {
  return <textarea className={`oa-input ${className}`} {...props} />;
}
export function Select({ className = "", ...props }) {
  return <select className={`oa-input ${className}`} {...props} />;
}
export function Card({ className = "", ...props }) {
  return <section className={`oa-card ${className}`} {...props} />;
}
export function Table({ children, ...props }) {
  return <div className="oa-table-scroll" tabIndex={0} aria-label="Daftar peserta diterima, dapat digulir horizontal"><table className="oa-table" {...props}>{children}</table></div>;
}
export function Modal({ open, onOpenChange, title, description, children, triggerRef, busy = false }) {
  useScrollLock(open);
  return <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
    <Dialog.Portal><Dialog.Overlay className="oa-overlay" />
      <Dialog.Content className="oa-dialog" data-lenis-prevent onCloseAutoFocus={(event) => { if (triggerRef?.current) { event.preventDefault(); triggerRef.current.focus(); } }}
        onPointerDownOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
        <header className="oa-dialog-header"><Dialog.Title className="oa-dialog-title">{title}</Dialog.Title><Dialog.Description className="oa-muted">{description}</Dialog.Description></header>
        {children}
        <Dialog.Close className="oa-close" aria-label="Tutup popup" disabled={busy}><X size={20} aria-hidden="true" /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
