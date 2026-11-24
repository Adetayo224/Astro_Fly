import type { Booking } from "@/lib/types"
import { formatEventDate } from "@/lib/format"
import { EmailLayout, GreenButton, H, P, RefBadge, Rows } from "./layout"

export default function PaymentReceiptEmail({
  booking,
  amount,
  paystackRef,
  siteUrl,
}: {
  booking: Booking
  amount: number
  paystackRef: string
  siteUrl: string
}) {
  const full = booking.status === "paid"
  return (
    <EmailLayout preview={`Payment of NGN ${amount.toLocaleString("en-NG")} received`} siteUrl={siteUrl}>
      <H>{full ? "Payment received in full" : "Payment received. Your date is held"}</H>
      <P>
        {full
          ? "Thank you. Your booking is fully paid and our pilot will be in touch before the event."
          : "Thank you. We have received your payment and your date is now held for you. We will send the final price soon if we have not already."}
      </P>
      <RefBadge reference={booking.reference} />
      <Rows
        rows={[
          ["Amount", `NGN ${amount.toLocaleString("en-NG")}`],
          ["Paid by", paystackRef],
          ["Event date", formatEventDate(booking.event_date)],
          ["Total paid", `NGN ${booking.amount_paid.toLocaleString("en-NG")}`],
          ...(booking.price
            ? ([["Balance", `NGN ${Math.max(booking.price - booking.amount_paid, 0).toLocaleString("en-NG")}`]] as [string, string][])
            : []),
        ]}
      />
      <GreenButton href={`${siteUrl}/bookings?ref=${booking.reference}`}>View your booking</GreenButton>
    </EmailLayout>
  )
}
