/**
 * Real photos and video stills from Astro_Fly shoots.
 * Drop files in public/gallery and list them here. While this list is empty the
 * gallery shows the shot types we fly instead of stock images.
 */
export interface GalleryItem {
  src: string
  alt: string
  caption: string
}

export const GALLERY: GalleryItem[] = []

/**
 * Videos from other creators, shown with credit until Astro_Fly has its own showreel.
 * Replace with your own YouTube video ids when ready.
 */
export interface FeaturedVideo {
  id: string
  title: string
  creator: string
  creatorUrl: string
}

export const FEATURED_VIDEOS: FeaturedVideo[] = [
  {
    id: "sXNCdaggfZU",
    title: "The 6 Cinematic Drone Shots I Use Every Time I Fly",
    creator: "Brett Conyers, Reel Prodigy",
    creatorUrl: "https://www.youtube.com/@reelprodigydrones",
  },
  {
    id: "S3I_GaZcB6o",
    title: "7 Cinematic Drone Moves for Wedding Videos",
    creator: "Grant Burks",
    creatorUrl: "https://www.youtube.com/@GrantBurks",
  },
]
