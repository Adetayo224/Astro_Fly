/** Custom line icons for the tab bar, drawn to match the HUD style. */
export function TabIcon({ name, active }: { name: string; active: boolean }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: active ? 2 : 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
        </svg>
      )
    case "drones":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.6" />
          <circle cx="18" cy="6" r="2.6" />
          <circle cx="6" cy="18" r="2.6" />
          <circle cx="18" cy="18" r="2.6" />
          <path d="M8 8l2.2 2.2M16 8l-2.2 2.2M8 16l2.2-2.2M16 16l-2.2-2.2" />
          <rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1.4" fill={active ? "currentColor" : "none"} />
        </svg>
      )
    case "bookings":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="3" />
          <path d="M8 3v4M16 3v4M4 10h16M8.5 14.5l2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />
          <path d="M9 11h.01M12 11h.01M15 11h.01" strokeWidth={2.4} />
        </svg>
      )
  }
}
