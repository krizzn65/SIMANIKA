export function PixelCorner({ position = "bottom-left", className = "" }) {
  let transform = "none";
  if (position === "top-right") {
    transform = "rotate(180deg)";
  } else if (position === "top-left") {
    transform = "scaleY(-1)";
  } else if (position === "bottom-right") {
    transform = "scaleX(-1)";
  }

  return (
    <div
      aria-hidden="true"
      className={`about-pixel-corner about-pixel-corner--${position} ${className}`}
    >
      <svg
        className="about-pixel-corner__svg"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform }}
      >
        {/* Row 1 (Bottom, y=140..160) */}
        <rect x="0" y="140" width="20" height="20" fill="#155EEF" />
        <rect x="20" y="140" width="20" height="20" fill="#2563EB" />
        <rect x="40" y="140" width="20" height="20" fill="#1D4ED8" />
        <rect x="60" y="140" width="40" height="20" fill="#0B2559" />
        <rect x="100" y="140" width="20" height="20" fill="#2563EB" />
        <rect x="120" y="140" width="20" height="20" fill="#155EEF" />
        <rect x="140" y="140" width="20" height="20" fill="#155EEF" />

        {/* Row 2 (y=120..140) */}
        <rect x="0" y="120" width="20" height="20" fill="#1D4ED8" />
        <rect x="20" y="120" width="20" height="20" fill="#2563EB" />
        <rect x="40" y="120" width="20" height="20" fill="#1E40AF" />
        <rect x="60" y="120" width="60" height="20" fill="#155EEF" />
        <rect x="120" y="120" width="20" height="20" fill="#155EEF" />

        {/* Row 3 (y=100..120) */}
        <rect x="0" y="100" width="20" height="20" fill="#2563EB" />
        <rect x="20" y="100" width="20" height="20" fill="#1E40AF" />
        <rect x="40" y="100" width="20" height="20" fill="#155EEF" />
        <rect x="60" y="100" width="60" height="20" fill="#155EEF" />
        <rect x="120" y="100" width="20" height="20" fill="#1D4ED8" />

        {/* Row 4 (y=80..100) */}
        <rect x="0" y="80" width="20" height="20" fill="#2563EB" />
        <rect x="20" y="80" width="20" height="20" fill="#1D4ED8" />
        <rect x="40" y="80" width="20" height="20" fill="#2563EB" />

        {/* Row 5 (y=60..80) */}
        <rect x="0" y="60" width="20" height="20" fill="#155EEF" />
        <rect x="20" y="60" width="20" height="20" fill="#155EEF" />

        {/* Row 6 (y=40..60) */}
        <rect x="0" y="40" width="20" height="20" fill="#155EEF" />

        {/* Row 7 (y=20..40) */}
        <rect x="0" y="20" width="20" height="20" fill="#155EEF" />

        {/* Row 8 (y=0..20) */}
        <rect x="0" y="0" width="20" height="20" fill="#155EEF" />
      </svg>
    </div>
  );
}
