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
