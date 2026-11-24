"use client"
import { Play } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import type { FeaturedVideo } from "@/lib/gallery"

/** Shows the thumbnail first and only loads YouTube when tapped, so the page stays fast. */
export function YouTubeLite({ video }: { video: FeaturedVideo }) {
  const [playing, setPlaying] = useState(false)
  return (
    <figure className="overflow-hidden rounded-[28px] border border-line bg-surface">
      <div className="relative aspect-video bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${video.title}`}
            className="group absolute inset-0"
          >
            <Image
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover opacity-85 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-signal text-ink shadow-[0_0_0_8px_rgba(0,255,133,.18),0_10px_40px_-6px_rgba(0,255,133,.7)] transition group-hover:scale-110 group-active:scale-95">
              <Play className="ml-1 size-7 fill-current" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-col gap-1 p-5">
        <p className="font-heading text-[16px] font-semibold">{video.title}</p>
        <p className="text-[12.5px] text-subtle">
          Video by{" "}
          <a href={video.creatorUrl} target="_blank" rel="noopener noreferrer" className="text-signal-ink hover:underline">
            {video.creator}
          </a>{" "}
          on{" "}
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-signal-ink hover:underline"
          >
            YouTube
          </a>
          . All rights belong to the creator.
        </p>
      </figcaption>
    </figure>
  )
}
