"use client";

/**
 * TechCornerBracket
 * 
 * Authentic sculpted Pixel-Art HUD corner bracket.
 * Combines retro 16-bit pixel aesthetics with a sculpted, chamfered aerospace silhouette:
 * - 45-degree stepped pixel staircase chamfer (eliminates flat boxy L-shape)
 * - Beveled wing tips & stepped contouring
 * - Handcrafted pixel shading: dark ink borders, vibrant electric blue body, and cyan edge highlights
 * - Pixelated vent slits (///) in the corner chamfer
 * - Floating pixel HUD rail with calibration ticks and pixel crosshair (+)
 * - Overlapping card-docking tab with bright pixel rivet accents
 * - Native SVG crispEdges for razor-sharp rendering on all screens
 */
export function TechCornerBracket({ position = "bottom-left", className = "" }) {
  const isTopRight = position === "top-right";

  return (
    <div
      aria-hidden="true"
      className={`tech-corner-bracket tech-corner-bracket--${position} ${className}`}
    >
      <svg
        className="tech-corner-bracket__svg"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        style={{
          transform: isTopRight ? "rotate(180deg)" : "none",
        }}
      >
        {/* ─── 1. FLOATING PIXEL HUD WIREFRAME & CALIBRATION ─── */}
        {/* Vertical floating guide line */}
        <rect x="2" y="6" width="1" height="19" fill="#3B82F6" opacity="0.85" />
        {/* Top tick mark */}
        <rect x="1" y="6" width="3" height="1" fill="#60A5FA" />

        {/* Stepped 45° pixel chamfer rail */}
        <rect x="3" y="25" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="4" y="26" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="5" y="27" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="6" y="28" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="7" y="29" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="8" y="30" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="9" y="31" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="10" y="32" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="11" y="33" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="12" y="34" width="1" height="1" fill="#3B82F6" opacity="0.85" />
        <rect x="13" y="35" width="1" height="1" fill="#3B82F6" opacity="0.85" />

        {/* Horizontal floating guide line */}
        <rect x="14" y="36" width="20" height="1" fill="#3B82F6" opacity="0.85" />
        {/* Right tick mark */}
        <rect x="34" y="35" width="1" height="3" fill="#60A5FA" />

        {/* Floating Pixel Crosshair (+) */}
        <rect x="5" y="33" width="3" height="1" fill="#BAE6FD" />
        <rect x="6" y="32" width="1" height="3" fill="#BAE6FD" />
        {/* Pixel satellite dot */}
        <rect x="3" y="30" width="1" height="1" fill="#60A5FA" />

        {/* ─── 2. DARK INK SHADOW / UNDERLAY (Neo-Brutalist Pop) ─── */}
        {/* Vertical arm dark outline */}
        <rect x="5" y="4" width="1" height="1" fill="#07111F" />
        <rect x="4" y="5" width="1" height="18" fill="#07111F" />
        
        {/* Stepped chamfer outer dark outline */}
        <rect x="5" y="23" width="1" height="1" fill="#07111F" />
        <rect x="6" y="24" width="1" height="1" fill="#07111F" />
        <rect x="7" y="25" width="1" height="1" fill="#07111F" />
        <rect x="8" y="26" width="1" height="1" fill="#07111F" />
        <rect x="9" y="27" width="1" height="1" fill="#07111F" />
        <rect x="10" y="28" width="1" height="1" fill="#07111F" />
        <rect x="11" y="29" width="1" height="1" fill="#07111F" />
        <rect x="12" y="30" width="1" height="1" fill="#07111F" />
        <rect x="13" y="31" width="1" height="1" fill="#07111F" />
        <rect x="14" y="32" width="1" height="1" fill="#07111F" />
        <rect x="15" y="33" width="1" height="1" fill="#07111F" />
        <rect x="16" y="34" width="1" height="1" fill="#07111F" />

        {/* Horizontal arm bottom dark outline */}
        <rect x="17" y="35" width="18" height="1" fill="#07111F" />
        <rect x="35" y="34" width="1" height="1" fill="#07111F" />
        <rect x="34" y="33" width="1" height="1" fill="#07111F" />

        {/* ─── 3. MAIN BRACKET BODY (Vibrant Electric Blue & Deep Shadows) ─── */}
        {/* Top beveled tip */}
        <rect x="7" y="2" width="2" height="1" fill="#2563EB" />
        <rect x="6" y="3" width="3" height="1" fill="#2563EB" />

        {/* Vertical arm body */}
        <rect x="5" y="4" width="4" height="19" fill="#2563EB" />
        {/* Vertical arm inner shadow facet */}
        <rect x="8" y="4" width="1" height="19" fill="#1D4ED8" />

        {/* Diagonal Chamfer Main Body Fill (45° Stepped Facet) */}
        <rect x="6" y="23" width="4" height="1" fill="#2563EB" />
        <rect x="7" y="24" width="4" height="1" fill="#2563EB" />
        <rect x="8" y="25" width="4" height="1" fill="#2563EB" />
        <rect x="9" y="26" width="4" height="1" fill="#2563EB" />
        <rect x="10" y="27" width="4" height="1" fill="#2563EB" />
        <rect x="11" y="28" width="4" height="1" fill="#2563EB" />
        <rect x="12" y="29" width="4" height="1" fill="#2563EB" />
        <rect x="13" y="30" width="4" height="1" fill="#2563EB" />
        <rect x="14" y="31" width="4" height="1" fill="#2563EB" />
        <rect x="15" y="32" width="4" height="1" fill="#2563EB" />

        {/* Horizontal arm body */}
        <rect x="16" y="31" width="18" height="3" fill="#2563EB" />
        {/* Horizontal arm bottom shadow facet */}
        <rect x="17" y="34" width="17" height="1" fill="#1E3A8A" />
        {/* Right beveled tip */}
        <rect x="34" y="31" width="1" height="2" fill="#2563EB" />
        <rect x="35" y="32" width="1" height="1" fill="#2563EB" />

        {/* ─── 4. BRIGHT CYAN EDGE HIGHLIGHTS (Pixel Bevel Polish) ─── */}
        {/* Outer vertical highlight line */}
        <rect x="5" y="5" width="1" height="18" fill="#93C5FD" />
        
        {/* Diagonal chamfer highlight steps */}
        <rect x="6" y="23" width="1" height="1" fill="#93C5FD" />
        <rect x="7" y="24" width="1" height="1" fill="#93C5FD" />
        <rect x="8" y="25" width="1" height="1" fill="#93C5FD" />
        <rect x="9" y="26" width="1" height="1" fill="#93C5FD" />
        <rect x="10" y="27" width="1" height="1" fill="#93C5FD" />
        <rect x="11" y="28" width="1" height="1" fill="#93C5FD" />
        <rect x="12" y="29" width="1" height="1" fill="#93C5FD" />
        <rect x="13" y="30" width="1" height="1" fill="#93C5FD" />
        <rect x="14" y="31" width="1" height="1" fill="#93C5FD" />
        <rect x="15" y="32" width="1" height="1" fill="#93C5FD" />

        {/* Horizontal arm top highlight line */}
        <rect x="16" y="31" width="18" height="1" fill="#93C5FD" />

        {/* ─── 5. PIXEL VENT SLOTS (///) In Corner Chamfer ─── */}
        {/* Slit 1 */}
        <rect x="7" y="23" width="1" height="1" fill="#07111F" />
        <rect x="8" y="24" width="1" height="1" fill="#07111F" />
        {/* Slit 2 */}
        <rect x="9" y="25" width="1" height="1" fill="#07111F" />
        <rect x="10" y="26" width="1" height="1" fill="#07111F" />
        {/* Slit 3 */}
        <rect x="11" y="27" width="1" height="1" fill="#07111F" />
        <rect x="12" y="28" width="1" height="1" fill="#07111F" />

        {/* ─── 6. CLEAN INNER CONTOUR (No Inward Bulge) ─── */}
        {/* Inner vertical border */}
        <rect x="9" y="4" width="1" height="19" fill="#07111F" />
        {/* Inner chamfer stepped border */}
        <rect x="10" y="23" width="1" height="1" fill="#07111F" />
        <rect x="11" y="24" width="1" height="1" fill="#07111F" />
        <rect x="12" y="25" width="1" height="1" fill="#07111F" />
        <rect x="13" y="26" width="1" height="1" fill="#07111F" />
        <rect x="14" y="27" width="1" height="1" fill="#07111F" />
        <rect x="15" y="28" width="1" height="1" fill="#07111F" />
        <rect x="16" y="29" width="1" height="1" fill="#07111F" />
        <rect x="17" y="30" width="1" height="1" fill="#07111F" />
        {/* Inner horizontal border */}
        <rect x="18" y="30" width="16" height="1" fill="#07111F" />

        {/* ─── 7. PIXEL ACCENT DETAILS ─── */}
        {/* Vertical arm status slot */}
        <rect x="7" y="8" width="1" height="3" fill="#BAE6FD" />
        {/* Horizontal arm status slot */}
        <rect x="25" y="33" width="3" height="1" fill="#BAE6FD" />
      </svg>
    </div>
  );
}
