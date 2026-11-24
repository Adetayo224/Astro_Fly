import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { BookTrigger } from "@/components/booking/booking-provider"
import { DroneCard } from "@/components/drones/drone-card"
import { NotifyMe } from "@/components/drones/notify-me"
import { Footer } from "@/components/shell/footer"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CATEGORY_LABEL, DRONES } from "@/lib/drones"
import { getDrone, getDrones } from "@/lib/server/drones"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return DRONES.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: PageProps<"/drones/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const d = await getDrone(slug)
  if (!d) return { title: "Drone not found" }
  return { title: d.name, description: `${d.tagline} ${d.description}` }
}

export default function DronePage({ params }: PageProps<"/drones/[slug]">) {
  return (
    <Suspense fallback={<DroneSkeleton />}>
      <DroneDetail params={params} />
    </Suspense>
  )
}

function DroneSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-28 pb-20 md:px-8 md:pt-36 lg:grid-cols-[1.15fr_1fr]">
      <Skeleton className="aspect-[4/3] rounded-[32px]" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-14 w-3/4 rounded-2xl" />
        <Skeleton className="h-5 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  )
}

async function DroneDetail({ params }: { params: PageProps<"/drones/[slug]">["params"] }) {
  const { slug } = await params
  const drone = await getDrone(slug)
  if (!drone) notFound()
  const soon = drone.status === "coming_soon"
  const others = (await getDrones())
    .filter((d) => d.slug !== drone.slug)
    .sort((a, b) => Number(a.status !== "available") - Number(b.status !== "available") || a.sort_order - b.sort_order)
    .slice(0, 3)

  const specs: [string, string][] = [
    ["Camera", drone.camera],
    ["Video", drone.video],
    ["Flight time", drone.flight_time],
    ["Weight", drone.weight],
    ["Range", drone.range],
    ["Obstacle sensing", drone.sensing],
  ]

  return (
    <>
      <article className="mx-auto max-w-7xl px-5 pt-[calc(env(safe-area-inset-top)+84px)] pb-20 md:px-8 md:pt-32">
        <Link
          href="/drones"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-[13px] font-medium text-subtle transition hover:text-fg active:scale-95"
        >
          <ArrowLeft className="size-4" /> All drones
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* Visual */}
          <div className="relative min-w-0 overflow-hidden rounded-[32px] border border-line bg-surface lg:sticky lg:top-28 lg:self-start">
            <div className="hud-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]" />
            <div
              className={cn(
                "absolute top-1/2 left-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]",
                soon ? "bg-fg/5" : "bg-signal/20",
              )}
            />
            <div className="relative aspect-[4/3]">
              <Image
                src={drone.image}
                alt={drone.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 640px"
                className={cn("object-contain p-6 md:p-10", soon && "opacity-60 grayscale-[50%]")}
              />
            </div>
            <div className="absolute inset-x-5 bottom-5 flex justify-between font-mono text-[10.5px] tracking-[0.18em] text-subtle uppercase">
              <span>{CATEGORY_LABEL[drone.category]}</span>
              <span>{drone.weight}</span>
            </div>
            <span className="brackets pointer-events-none absolute inset-4 rounded-[24px]" />
          </div>

          {/* Details */}
          <div className="flex min-w-0 flex-col">
            <div>
              {soon ? (
                <span className="inline-flex rounded-full border border-line px-3 py-1 font-mono text-[10.5px] tracking-[0.16em] text-subtle uppercase">
                  Coming soon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-signal px-3 py-1 font-mono text-[10.5px] font-semibold tracking-[0.16em] text-ink uppercase">
                  <span className="size-1.5 animate-pulse rounded-full bg-ink" /> Available to book
                </span>
              )}
            </div>
            <div>
              <h1 className="mt-5 text-[40px] leading-[1.02] font-semibold md:text-[56px]">{drone.name}</h1>
            </div>
            <div>
              <p className="mt-3 text-[18px] text-fg/85">{drone.tagline}</p>
            </div>
            <div>
              <p className="mt-4 text-[15.5px] leading-relaxed text-subtle">{drone.description}</p>
            </div>

            <div className="mt-8">
              <p className="eyebrow">Best for</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {drone.best_for.map((b) => (
                  <li key={b} className="rounded-full border border-line bg-surface px-3.5 py-2 text-[13px] font-medium">
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <p className="eyebrow">Specs</p>
              <dl className="mt-3 divide-y divide-line rounded-3xl border border-line bg-surface/60 px-5">
                {specs.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-3.5">
                    <dt className="text-[13.5px] text-subtle">{k}</dt>
                    <dd className="text-right font-mono text-[13px]">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[12px] text-subtle">Specs from DJI. Real results depend on weather and venue.</p>
            </div>

            <div className="mt-8">
              {soon ? (
                <div className="rounded-3xl border border-line bg-surface p-5">
                  <p className="text-[15px] font-semibold">Not bookable yet</p>
                  <p className="mt-1 mb-4 text-[13.5px] text-subtle">
                    Leave your email and we will tell you when the {drone.name} joins the fleet.
                  </p>
                  <NotifyMe droneSlug={drone.slug} droneName={drone.name} />
                </div>
              ) : (
                <BookTrigger drone={drone.slug} className={cn(buttonVariants({ size: "xl", block: true }))}>
                  Book Now
                </BookTrigger>
              )}
            </div>
          </div>
        </div>

        <section className="mt-24">
          <h2 className="text-[26px] font-semibold md:text-[32px]">Other drones</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((d) => (
              <DroneCard key={d.slug} drone={d} />
            ))}
          </div>
        </section>
      </article>
      <Footer />
    </>
  )
}
