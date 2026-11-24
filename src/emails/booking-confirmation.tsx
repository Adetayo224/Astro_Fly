import type { Booking } from "@/lib/types"
import { deliverableLabels, formatEventDate, formatTime } from "@/lib/format"
import { BankDetails, Divider, EmailLayout, GreenButton, H, P, RefBadge, Rows } from "./layout"

export default function BookingConfirmationEmail({
  booking,
  siteUrl,
  depositNaira = 20000,
}: {
  booking: Booking
  siteUrl: string
  depositNaira?: number
}) {
  const first = booking.full_name.split(" ")[0]
  const wa = `https://wa.me/2349069583537?text=${encodeURIComponent(
    `Hello Astro_Fly, my booking reference is ${booking.reference}.`,
  )}`
  return (
    <EmailLayout preview={`We have your booking. Reference ${booking.reference}`} siteUrl={siteUrl}>
      <H>Thank you, {first}. We have your booking.</H>
      <P>
        Our team will look at your event details and get back to you within 24 hours with the price and a
        confirmation. Keep this reference handy. You will need it to check your booking.
      </P>
      <RefBadge reference={booking.reference} />
      <Rows
        rows={[
          ["Event", booking.event_type],
          ["Date", formatEventDate(booking.event_date)],
          ["Start time", formatTime(booking.start_time)],
          ["Duration", booking.duration === "Custom" ? booking.custom_duration || "Custom" : booking.duration],
          ["Venue", `${booking.venue_name}, ${booking.city}`],
          ["Drone", booking.drone_name],
          ["You want", deliverableLabels(booking.deliverables).join(", ")],
          ["Pilot", booking.needs_pilot ? "We will match you with an Astro_Fly pilot" : "Your own pilot"],
          ["Price", booking.price ? `NGN ${booking.price.toLocaleString("en-NG")}` : "To be confirmed"],
        ]}
      />
      {booking.pay_option === "deposit" ? (
        <>
          <Divider />
          <P>You chose to pay now to hold your date. Transfer it to the account below. Your date is held once we confirm it by email.</P>
          <BankDetails
            reference={booking.reference}
            amount={`NGN ${(depositNaira + booking.pilot_fee).toLocaleString("en-NG")}${booking.pilot_fee ? ` (includes NGN ${booking.pilot_fee.toLocaleString("en-NG")} for your pilot)` : ""}`}
          />
        </>
      ) : null}
      <Divider />
      <P>Questions before then? Message us on WhatsApp and quote your reference.</P>
      <GreenButton href={wa}>Chat with us on WhatsApp</GreenButton>
      <P>
        <span style={{ fontSize: 13 }}>
          Track your booking any time at {siteUrl.replace(/^https?:\/\//, "")}/bookings
        </span>
      </P>
    </EmailLayout>
  )
}
