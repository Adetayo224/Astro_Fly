import { ButtonLink } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="relative grid min-h-svh place-items-center px-5 text-center">
      <div className="hud-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative">
        <p className="font-mono text-[12px] tracking-[0.3em] text-signal-ink">SIGNAL LOST · 404</p>
        <h1 className="mt-4 text-[40px] font-semibold md:text-[56px]">This page flew off the map.</h1>
        <p className="mx-auto mt-3 max-w-md text-subtle">The link may be old or mistyped. Head back and we will guide you in.</p>
        <ButtonLink href="/" size="xl" className="mt-8">
          Back to home
        </ButtonLink>
      </div>
    </div>
  )
}
