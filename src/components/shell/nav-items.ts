export const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/drones", label: "Drones", icon: "drones" },
  { href: "/bookings", label: "Bookings", icon: "bookings" },
  { href: "/chat", label: "Chat", icon: "chat" },
] as const

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
