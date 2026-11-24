"use client"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Logo } from "@/components/brand/logo"
import { Field, PasswordInput } from "@/components/booking/fields"
import { SuccessCheck } from "@/components/booking/success-screen"
import { Button, ButtonLink } from "@/components/ui/button"
import { supabaseBrowser } from "@/lib/supabase-browser"

/**
 * Landing page for invite and password reset links. Supabase puts a session in the URL;
 * the person chooses their own password here, then goes to the dashboard.
 */
export function AcceptInvite() {
  const router = useRouter()
  const [state, setState] = useState<"checking" | "ready" | "expired" | "done">("checking")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const sb = supabaseBrowser()
    if (!sb) return
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const linkError = hash.get("error_description")
    let settled = false
    const done = (ok: boolean, mail?: string) => {
      if (settled) return
      settled = true
      if (ok) {
        setEmail(mail ?? "")
        setState("ready")
        window.history.replaceState(null, "", window.location.pathname)
      } else setState("expired")
    }
    if (linkError) {
      done(false)
      return
    }
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (session) done(true, session.user.email)
    })
    sb.auth.getSession().then(({ data }) => {
      if (data.session) done(true, data.session.user.email)
    })
    const t = setTimeout(() => done(false), 4000)
    return () => {
      clearTimeout(t)
      sub.subscription.unsubscribe()
    }
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)
    if (password.length < 8) return setError("Use at least 8 characters")
    if (password !== confirm) return setError("The two passwords do not match")
    const sb = supabaseBrowser()
    if (!sb) return
    setSaving(true)
    const { error } = await sb.auth.updateUser({ password })
    setSaving(false)
    if (error) return setError(error.message)
    setState("done")
    setTimeout(() => router.push("/admin"), 1600)
  }

  return (
    <div className="relative grid min-h-svh place-items-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="brackets glass relative w-full max-w-sm rounded-[28px] p-7"
      >
        <Logo />
        {state === "checking" && (
          <div className="flex items-center gap-3 py-10 text-subtle">
            <Loader2 className="size-5 animate-spin text-signal-ink" /> Checking your link
          </div>
        )}
        {state === "expired" && (
          <div className="mt-8 flex flex-col gap-4">
            <h1 className="text-[24px] font-semibold">This link has expired</h1>
            <p className="text-[14px] leading-relaxed text-subtle">
              Links work for one hour and only once. Ask for a fresh one from the sign in page with Forgot password.
            </p>
            <ButtonLink href="/admin" size="lg" block>
              Go to sign in
            </ButtonLink>
          </div>
        )}
        {state === "ready" && (
          <form onSubmit={save} className="mt-8 flex flex-col gap-4">
            <h1 className="text-[24px] font-semibold">Choose your password</h1>
            <p className="text-[14px] text-subtle">
              For <span className="text-fg">{email}</span>. You will use it to sign in to the Astro_Fly dashboard.
            </p>
            <Field label="New password" htmlFor="np">
              <PasswordInput id="np" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Type it again" htmlFor="np2">
              <PasswordInput id="np2" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="submit" size="xl" block disabled={saving}>
              {saving && <Loader2 className="animate-spin" />} Save password
            </Button>
          </form>
        )}
        {state === "done" && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <SuccessCheck size={88} />
            <p className="text-[18px] font-semibold">Password saved</p>
            <p className="text-[13.5px] text-subtle">Taking you to the dashboard</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
