import type { Metadata } from "next"
import { DroneBrowser } from "@/components/drones/drone-browser"
import { Footer } from "@/components/shell/footer"
import { getDrones } from "@/lib/server/drones"

export const metadata: Metadata = {
  title: "Drones",
  description: "The DJI drones Astro_Fly flies for weddings, concerts, church programmes and launches in Nigeria.",
}

export default async function DronesPage() {
  const drones = await getDrones()
  const available = drones.filter((d) => d.status === "available").length
  return (
    <>
      <div className="mx-auto max-w-7xl px-5 pt-[calc(env(safe-area-inset-top)+96px)] pb-24 md:px-8 md:pt-36">
        <p className="eyebrow">The fleet</p>
        <h1 className="mt-4 max-w-3xl text-[40px] leading-[1.02] font-semibold md:text-[64px]">
          Pick the drone that fits your day.
        </h1>
        <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-subtle md:text-[17px]">
          {available} drones are booking now. The rest are joining the fleet soon. Leave your email on any of them and we
          will tell you the moment it can fly for you.
        </p>
        <div className="mt-10">
          <DroneBrowser drones={drones} />
        </div>
      </div>
      <Footer />
    </>
  )
}
