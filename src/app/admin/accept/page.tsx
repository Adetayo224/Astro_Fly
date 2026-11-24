import type { Metadata } from "next"
import { AcceptInvite } from "@/components/admin/accept-invite"

export const metadata: Metadata = { title: "Set your password", robots: { index: false, follow: false } }

export default function AcceptPage() {
  return <AcceptInvite />
}
