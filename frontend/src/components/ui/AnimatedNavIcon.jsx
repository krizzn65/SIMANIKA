export function AnimatedNavIcon({ name }) {
  const commonProps = {
    "aria-hidden": true,
    className: `nav-link__icon nav-link__icon--${name}`,
    fill: "none",
    viewBox: "0 0 24 24",
  };

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path className="nav-icon__home-roof" d="m3.5 10.5 8.5-7 8.5 7" />
        <path className="nav-icon__home-base" d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (name === "event") {
    return (
      <svg {...commonProps}>
        <path className="nav-icon__event-tabs" d="M8 3v4M16 3v4" />
        <rect className="nav-icon__event-frame" x="3" y="5" width="18" height="16" rx="2" />
        <path className="nav-icon__event-line" d="M3 10h18" />
        <path className="nav-icon__event-date" d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    );
  }

  if (name === "oprec") {
    return (
      <svg {...commonProps}>
        <circle className="nav-icon__oprec-head" cx="9" cy="8" r="3" />
        <path className="nav-icon__oprec-body" d="M3 20c0-4 2.7-7 6-7s6 3 6 7" />
        <path className="nav-icon__oprec-plus" d="M18 7v6M15 10h6" />
      </svg>
    );
  }

  if (name === "testimoni") {
    return (
      <svg {...commonProps} stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="nav-icon__testi-bubble"
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        />
        <path className="nav-icon__testi-line-1" d="M8 9h8" />
        <path className="nav-icon__testi-line-2" d="M8 13h5" />
      </svg>
    );
  }

  if (name === "merchandise") {
    return (
      <svg {...commonProps}>
        <path
          className="nav-icon__merch-bag"
          d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
        />
        <path className="nav-icon__merch-top" d="M3 6h18" />
        <path
          className="nav-icon__merch-handle"
          d="M16 10a4 4 0 0 1-8 0"
        />
      </svg>
    );
  }

  return null;
}
