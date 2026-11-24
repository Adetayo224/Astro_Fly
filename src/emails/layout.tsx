import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import type { ReactNode } from "react"

export const C = {
  black: "#050505",
  graphite: "#111412",
  line: "#232824",
  green: "#00FF85",
  text: "#F5F7F5",
  muted: "#9BA39D",
}

const font =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
const mono = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace"

export function EmailLayout({
  preview,
  children,
  siteUrl,
}: {
  preview: string
  children: ReactNode
  siteUrl: string
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ background: C.black, margin: 0, padding: "32px 0", fontFamily: font }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
          <Section style={{ padding: "8px 4px 24px" }}>
            <Text style={{ margin: 0, color: C.text, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              Astro<span style={{ color: C.green }}>_</span>Fly
            </Text>
            <Text style={{ margin: "2px 0 0", color: C.muted, fontSize: 12, fontFamily: mono }}>
              by Samfred Robotics
            </Text>
          </Section>
          <Section
            style={{
              background: C.graphite,
              border: `1px solid ${C.line}`,
              borderRadius: 18,
              padding: "28px 24px",
            }}
          >
            {children}
          </Section>
          <Section style={{ padding: "24px 4px" }}>
            <Text style={{ color: C.muted, fontSize: 12, lineHeight: "18px", margin: 0 }}>
              Astro_Fly is a service of Samfred Robotics Ltd.
              <br />
              New Sawmill Area, Pakiotan Estate, Ogbomoso, Oyo State, Nigeria.
            </Text>
            <Text style={{ color: C.muted, fontSize: 12, margin: "10px 0 0" }}>
              <Link href={siteUrl} style={{ color: C.green }}>
                Visit Astro_Fly
              </Link>
              {"  ·  "}
              <Link href="https://wa.me/2349069583537" style={{ color: C.green }}>
                WhatsApp us
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export function H({ children }: { children: ReactNode }) {
  return (
    <Text style={{ color: C.text, fontSize: 24, lineHeight: "30px", fontWeight: 700, margin: "0 0 12px", letterSpacing: -0.6 }}>
      {children}
    </Text>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={{ color: "#C9D0CB", fontSize: 15, lineHeight: "24px", margin: "0 0 14px" }}>{children}</Text>
}

export function RefBadge({ reference }: { reference: string }) {
  return (
    <Section
      style={{
        border: `1px solid ${C.green}`,
        borderRadius: 12,
        padding: "14px 16px",
        margin: "8px 0 20px",
        background: "#0B1A12",
      }}
    >
      <Text style={{ margin: 0, color: C.muted, fontSize: 11, letterSpacing: 2, fontFamily: mono }}>
        BOOKING REFERENCE
      </Text>
      <Text style={{ margin: "4px 0 0", color: C.green, fontSize: 24, fontWeight: 700, letterSpacing: 2, fontFamily: mono }}>
        {reference}
      </Text>
    </Section>
  )
}

export function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <Section style={{ margin: "4px 0 8px" }}>
      {rows.map(([k, v], i) => (
        <table key={k} width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            <tr>
              <td
                style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                  color: C.muted,
                  fontSize: 13,
                  width: "40%",
                  verticalAlign: "top",
                }}
              >
                {k}
              </td>
              <td
                style={{
                  padding: "10px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                  color: C.text,
                  fontSize: 14,
                  textAlign: "right",
                }}
              >
                {v}
              </td>
            </tr>
          </tbody>
        </table>
      ))}
    </Section>
  )
}

export function GreenButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "22px 0 6px" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          background: C.green,
          color: C.black,
          fontWeight: 700,
          fontSize: 15,
          padding: "14px 22px",
          borderRadius: 999,
          textDecoration: "none",
        }}
      >
        {children}
      </Link>
    </Section>
  )
}

export const BANK = { name: "Fidelity Bank", accountNumber: "6060500990", accountName: "Samfred Robotics LTD" }

/** Bank transfer details. Customers pay by transfer and the team confirms by email. */
export function BankDetails({ reference, amount }: { reference: string; amount?: string }) {
  return (
    <Section style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", margin: "8px 0 16px" }}>
      <Text style={{ margin: 0, color: C.muted, fontSize: 11, letterSpacing: 2, fontFamily: mono }}>PAY BY BANK TRANSFER</Text>
      <Rows
        rows={[
          ...(amount ? ([["Amount", amount]] as [string, string][]) : []),
          ["Bank", BANK.name],
          ["Account number", BANK.accountNumber],
          ["Account name", BANK.accountName],
          ["Narration", reference],
        ]}
      />
      <Text style={{ margin: 0, color: C.muted, fontSize: 12, lineHeight: "18px" }}>
        Please use your booking reference as the narration. We confirm every payment by email.
      </Text>
    </Section>
  )
}

export function Divider() {
  return <Hr style={{ borderColor: C.line, margin: "18px 0" }} />
}
