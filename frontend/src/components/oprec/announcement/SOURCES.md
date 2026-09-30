# Announcement UI sources

- `RollingCountdown.jsx` adapts the digit-window and spring transform pattern from [React Bits Counter](https://github.com/DavidHDev/react-bits/blob/main/src/content/Components/Counter/Counter.jsx). Changed to a countdown, upward rollover, server clock synchronization, reduced motion and visibility-aware timers. See `react-bits.LICENSE.md`.
- `Primitives.jsx` adapts [shadcn/ui](https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui), available through [21st.dev](https://21st.dev/@shadcn/components/button). Dialog uses the same Radix accessibility primitive. Styling is scoped to SIMANIKA square cards and compact admin controls. See `shadcn.LICENSE.md`.
- Page composition, result verification and backend authorization are application-specific; no remote component scripts execute at runtime.

Source/license review: 30 September 2026.
