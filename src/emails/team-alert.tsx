import type { Booking } from "@/lib/types"
import { deliverableLabels, formatEventDate, formatTime } from "@/lib/format"
import { EmailLayout, GreenButton, H, P, RefBadge, Rows } from "./layout"

export default function TeamAlertEmail({ booking, siteUrl }: { booking: Booking; siteUrl: string }) {
  return (
    <EmailLayout preview={`New booking ${booking.reference} from ${booking.full_name}`} siteUrl={siteUrl}>
      <H>New booking request</H>
      <P>
        {booking.full_name} wants a {booking.drone_name} for a {booking.event_type.toLowerCase()} on{" "}
        {formatEventDate(booking.event_date)}.
      </P>
      <RefBadge reference={booking.reference} />
      <Rows
        rows={[
          ["Name", booking.full_name],
          ["Email", booking.email],
          ["Phone", booking.phone],
          ["WhatsApp", booking.whatsapp],
          ["Event", booking.event_type],
          ["Date and time", `${formatEventDate(booking.event_date)} at ${formatTime(booking.start_time)}`],
          ["Duration", booking.duration === "Custom" ? booking.custom_duration || "Custom" : booking.duration],
          ["Venue", booking.venue_name],
          ["Address", `${booking.address}, ${booking.city}, ${booking.state}`],
          ["Setting", booking.setting],
          ["Guests", booking.guests],
          ["Drone", booking.drone_name],
          ["Deliverables", deliverableLabels(booking.deliverables).join(", ")],
          [
            "Flyer",
            booking.has_flyer
              ? `Uploaded (${booking.flyer_name})`
              : booking.design_flyer
                ? "Please design one"
                : "None",
          ],
          ["Flyer details", booking.flyer_details || "None"],
          ["Notes", booking.notes || "None"],
          ["Payment", booking.pay_option === "deposit" ? "Wants to pay a deposit now" : "Pay after confirmation"],
        ]}
      />
      <GreenButton href={`${siteUrl}/admin`}>Open the dashboard</GreenButton>
    </EmailLayout>
  )
}
