"use client";

import { useState, useEffect } from "react";

/**
 * UserAvatar Component
 * - Menampilkan foto profil Google jika ada (dengan referrerPolicy="no-referrer" agar Google tidak memblokir gambar).
 * - Jika foto profil tidak ada atau gagal dimuat, menampilkan inisial huruf pertama dari nama/email dengan background biru.
 */
export function UserAvatar({
  src,
  name,
  email,
  size = "100%",
  fontSize = "0.95rem",
  borderRadius = "inherit",
  className = "",
  style = {},
}) {
  const [hasError, setHasError] = useState(false);

  // Reset status error jika URL foto berganti
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const rawName = (name && name.toLowerCase() !== "akun saya" ? name : (email ? email.split("@")[0] : "U")).trim();
  const initial = (rawName.charAt(0) || "U").toUpperCase();

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={rawName}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          borderRadius,
          display: "block",
          flexShrink: 0,
          ...style,
        }}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <span
      className={`user-avatar-initial ${className}`}
      style={{
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        minWidth: typeof size === "number" ? size : undefined,
        minHeight: typeof size === "number" ? size : undefined,
        backgroundColor: "var(--blue, #155eef)",
        color: "#ffffff",
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
        borderRadius,
        userSelect: "none",
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
