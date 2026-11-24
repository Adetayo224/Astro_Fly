import { existsSync } from "node:fs"
import path from "node:path"
import { ArrowRight } from "lucide-react"
import { Contact } from "@/components/home/contact"
import { DroneCarousel } from "@/components/home/drone-carousel"
import { EventTypes } from "@/components/home/event-types"
import { FAQ } from "@/components/home/faq"
import { Gallery } from "@/components/home/gallery"
import { Hero } from "@/components/home/hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { SectionHeading } from "@/components/home/reveal"
import { Reviews } from "@/components/home/reviews"
import { Footer } from "@/components/shell/footer"
import { ButtonLink } from "@/components/ui/button"
import { getDrones } from "@/lib/server/drones"

// Use a real GLB model when one has been added to public/models.
const MODEL_URL = existsSync(path.join(process.cwd(), "public/models/drone.glb")) ? "/models/drone.glb" : undefined

export default async function HomePage() {
  const drones = await getDrones()
  const ordered = [...drones].sort(
    (a, b) => Number(a.status !== "available") - Number(b.status !== "available") || a.sort_order - b.sort_order,
  )
  return (
    <>
      <Hero modelUrl={MODEL_URL} />

      <section id="drones" className="relative scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto mb-12 flex max-w-7xl flex-col gap-6 px-5 md:mb-16 md:flex-row md:items-end md:justify-between md:px-8">
          <SectionHeading
            eyebrow="The fleet"
            title="Ready to fly for you."
            body="Two drones are booking now. More are on the way. Tap one that is coming soon and we will email you when it lands."
          />
          <ButtonLink href="/drones" variant="outline" size="lg" className="self-start md:mr-[108px] md:self-auto">
            All drones <ArrowRight />
          </ButtonLink>
        </div>
        <div className="mx-auto max-w-7xl">
          <DroneCarousel drones={ordered} />
        </div>
      </section>

      <HowItWorks />
      <EventTypes />
      <Gallery />
      <Reviews />
      <FAQ />
      <Contact />
      <Footer />
    </>
  )
}
