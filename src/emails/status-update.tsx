import type { Booking, BookingStatus } from "@/lib/types"
import { formatEventDate } from "@/lib/format"
import { BankDetails, EmailLayout, GreenButton, H, P, RefBadge, Rows } from "./layout"

const COPY: Record<BookingStatus, { title: string; body: string }> = {
  pending: {
    title: "Your booking is back under review",
    body: "We are taking another look at your event details. We will message you shortly.",
  },
  confirmed: {
    title: "Your date is confirmed",
    body: "Good news. A pilot and drone are now reserved for your event. Your price is below. Pay by bank transfer using the details in this email, and we will confirm by email once it lands.",
  },
  paid: {
    title: "Payment received. You are all set",
    body: "Thank you. Your booking is fully paid. Our pilot will reach out a few days before the event to plan the shots and check the venue.",
  },
  completed: {
    title: "Thank you for flying with us",
    body: "We hope you loved the day. Your files will be shared using the delivery method we agreed. If you have a minute, we would love to hear how it went.",
  },
  cancelled: {
    title: "Your booking has been cancelled",
    body: "This booking is now cancelled. If this was not expected, reply on WhatsApp with your reference and we will sort it out.",
  },
}

export default function StatusUpdateEmail({
  booking,
  siteUrl,
  message,
}: {
  booking: Booking
  siteUrl: string
  message?: string | null
}) {
  const c = COPY[booking.status]
  const balance = booking.price ? Math.max(booking.price - booking.amount_paid, 0) : null
  return (
    <EmailLayout preview={`${c.title}. Reference ${booking.reference}`} siteUrl={siteUrl}>
      <H>{c.title}</H>
      <P>{c.body}</P>
      {message ? <P>{message}</P> : null}
      <RefBadge reference={booking.reference} />
      <Rows
        rows={[
          ["Event", booking.event_type],
          ["Date", formatEventDate(booking.event_date)],
          ["Drone", booking.drone_name],
          ["Price", booking.price ? `NGN ${booking.price.toLocaleString("en-NG")}` : "To be confirmed"],
          ["Paid so far", `NGN ${booking.amount_paid.toLocaleString("en-NG")}`],
          ...(balance !== null ? ([["Balance", `NGN ${balance.toLocaleString("en-NG")}`]] as [string, string][]) : []),
        ]}
      />
      {balance && booking.status !== "cancelled" && booking.status !== "completed" ? (
        <BankDetails reference={booking.reference} amount={`NGN ${balance.toLocaleString("en-NG")}`} />
      ) : null}
      <GreenButton href={`${siteUrl}/bookings?ref=${booking.reference}`}>View your booking</GreenButton>
    </EmailLayout>
  )
}
