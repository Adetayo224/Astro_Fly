import type { Booking } from "@/lib/types"
import { formatEventDate } from "@/lib/format"
import { EmailLayout, GreenButton, H, P, RefBadge } from "./layout"

/** Free form message written by the team in the dashboard. */
export default function CustomMessageEmail({
  booking,
  subject,
  message,
  siteUrl,
}: {
  booking: Booking
  subject: string
  message: string
  siteUrl: string
}) {
  const first = booking.full_name.split(" ")[0]
  return (
    <EmailLayout preview={subject} siteUrl={siteUrl}>
      <H>{subject}</H>
      <P>Hello {first},</P>
      {message.split(/\n{2,}/).map((para, i) => (
        <P key={i}>
          {para.split("\n").map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line}
            </span>
          ))}
        </P>
      ))}
      <P>The Astro_Fly team</P>
      <RefBadge reference={booking.reference} />
      <P>
        <span style={{ fontSize: 13 }}>
          About your {booking.event_type.toLowerCase()} on {formatEventDate(booking.event_date)}.
        </span>
      </P>
      <GreenButton href={`${siteUrl}/bookings?ref=${booking.reference}`}>View your booking</GreenButton>
    </EmailLayout>
  )
}
