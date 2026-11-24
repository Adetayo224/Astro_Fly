import type { ReactNode } from "react"

/**
 * Page transition: a short fade and lift on every route change.
 * Pure CSS, so the first paint is never held back waiting for JavaScript.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>
}
