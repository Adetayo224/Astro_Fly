/**
 * Real customer reviews only. Add them here (or move to Supabase later) as they come in.
 * The section shows a designed empty state while this list is empty.
 */
export interface Review {
  name: string
  event: string
  quote: string
  date: string
}

export const REVIEWS: Review[] = []
