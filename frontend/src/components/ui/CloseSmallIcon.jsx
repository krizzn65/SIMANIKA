"use client";

/**
 * CloseSmallIcon
 * 21st.dev animated close (X) icon with sequential stroke-dashoffset animation.
 * Animates in place with zero translation, zero wobbling.
 */
export function CloseSmallIcon({ size = 20, className = "", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={`close-small-icon ${className}`}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeDasharray="18"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M7 7l10 10">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            dur="0.32s"
            values="18;0"
          />
        </path>
        <path strokeDashoffset="18" d="M17 7l-10 10">
          <animate
            fill="freeze"
            attributeName="stroke-dashoffset"
            begin="0.16s"
            dur="0.32s"
            values="18;0"
          />
        </path>
      </g>
    </svg>
  );
}
