import type { Booking } from "@/lib/types"
import { formatEventDate, formatTime } from "@/lib/format"
import { EmailLayout, GreenButton, H, P, RefBadge, Rows } from "./layout"

/** Introduces the pilot the team matched to this booking. */
export default function PilotAssignedEmail({ booking, siteUrl }: { booking: Booking; siteUrl: string }) {
  const first = booking.full_name.split(" ")[0]
  const digits = (booking.pilot_phone || "").replace(/\D/g, "").replace(/^0/, "234")
  return (
    <EmailLayout preview={`Meet your pilot: ${booking.pilot_name}`} siteUrl={siteUrl}>
      <H>Meet your pilot, {first}</H>
      <P>
        {booking.pilot_name} will fly for you on {formatEventDate(booking.event_date)}. They will reach out before the
        day to plan the shots with you, and you can contact them directly too.
      </P>
      <RefBadge reference={booking.reference} />
      <Rows
        rows={[
          ["Pilot", booking.pilot_name || ""],
          ...(booking.pilot_phone ? ([["Phone", booking.pilot_phone]] as [string, string][]) : []),
          ["Event", booking.event_type],
          ["Date and time", `${formatEventDate(booking.event_date)} at ${formatTime(booking.start_time)}`],
          ["Venue", `${booking.venue_name}, ${booking.city}`],
          ["Drone", booking.drone_name],
        ]}
      />
      {digits ? (
        <GreenButton href={`https://wa.me/${digits}`}>Message your pilot on WhatsApp</GreenButton>
      ) : (
        <GreenButton href={`${siteUrl}/bookings?ref=${booking.reference}`}>View your booking</GreenButton>
      )}
    </EmailLayout>
  )
}
