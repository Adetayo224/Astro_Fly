import { NextResponse, type NextRequest } from "next/server"
import { settlePayment } from "@/lib/server/payments"

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference")
  if (!reference) return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 })
  try {
    const r = await settlePayment(reference)
    if (!r.ok) return NextResponse.json({ ok: false, error: "We could not confirm this payment yet." }, { status: 402 })
    return NextResponse.json({
      ok: true,
      amount: r.amount,
      booking: { reference: r.booking.reference, status: r.booking.status, email: r.booking.email },
    })
  } catch (e) {
    console.error("[paystack:verify]", e)
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 })
  }
}
