import Link from "next/link";

function PixelArrow() {
  return (
    <svg
      aria-hidden="true"
      className="split-cta__arrow"
      viewBox="0 0 24 24"
      fill="none"
      shapeRendering="crispEdges"
    >
      <path
        d="M3 6h3v3h3v3h3v3H9v3H6v3H3v-3h3v-3h3v-3H6V9H3V6Zm9 0h3v3h3v3h3v3h-3v3h-3v3h-3v-3h3v-3h3v-3h-3V9h-3V6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SplitCta({ href, children, className = "" }) {
  return (
    <Link className={`split-cta ${className}`.trim()} href={href}>
      <span className="split-cta__icon">
        <PixelArrow />
      </span>
      <span className="split-cta__label">{children}</span>
    </Link>
  );
}
