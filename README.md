# Astro_Fly

Drone shoot booking app for **Astro_Fly**, a service of Samfred Robotics Ltd (Ogbomoso, Nigeria).
Customers pick a drone, fill a four step booking form, optionally pay a deposit with Paystack, and get an
email confirmation. The team manages everything from a protected admin dashboard.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, shadcn/ui, React Three Fiber
+ drei + postprocessing, Framer Motion, GSAP ScrollTrigger + Lenis, React Hook Form + Zod, Supabase, Resend +
React Email, Paystack and a PWA manifest with a service worker.

---

## 1. Run it locally

Requires Node.js 20.9 or newer.

```bash
cd astro-fly
npm install
cp .env.example .env.local   # already done once; every key is optional for local design work
npm run dev
```

Open http://localhost:3000.

**No keys? It still works.** With an empty `.env.local` the app runs in mock mode:

| Piece | Mock behaviour |
| --- | --- |
| Drones | Served from `src/lib/drones.ts` |
| Bookings, status history, notify me | Kept in server memory until the dev server restarts |
| Emails | Rendered and saved as HTML files in `.mock_emails/` so you can open and check them |
| Paystack | "Pay deposit" skips straight to the success callback and marks the deposit as paid |
| Admin | `/admin` shows an "Open demo dashboard" button with two sample bookings |

---

## 2. Environment variables

All keys live in `.env.local` (never commit it). `.env.example` lists every variable.

| Variable | Where to get it | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your live URL, e.g. `https://astrofly.ng` | Links in emails, Paystack callback |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Your inbox | Shown on the site and in emails |
| `NEXT_PUBLIC_DEPOSIT_NGN` | Your choice (default `20000`) | Deposit amount at checkout |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project settings > API | Database, storage, admin login |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project settings > API | Admin login in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project settings > API (secret) | Server routes only |
| `ADMIN_EMAILS` | Comma separated emails | Who may open `/admin` (or use the `admins` table) |
| `RESEND_API_KEY` | resend.com > API Keys | Sending email |
| `EMAIL_FROM` | A sender on a domain verified in Resend | From address, e.g. `Astro_Fly <bookings@astrofly.ng>` |
| `TEAM_EMAIL` | Your team inbox | New booking alerts |
| `PAYSTACK_SECRET_KEY` | Paystack > Settings > API Keys | Initialise and verify payments, webhook signature |
| `NEXT_PUBLIC_MODEL_CREDIT` | Author line for a CC BY 3D model | Shown in the footer |
| `ALLOW_DEMO_ADMIN` | `true` or `false` | Only for previewing a production build without Supabase |

You can enable services one at a time. For example, add only the Supabase keys and emails stay mocked.

---

## 3. Supabase setup

1. Create a project at https://supabase.com (region close to Nigeria, e.g. EU West).
2. Run the migrations in `supabase/migrations/` **in order**:
   * Easiest: open **SQL Editor**, paste `20261124000001_init.sql`, run it, then paste and run
     `20261124000002_seed_drones.sql`.
   * Or with the CLI: `npx supabase link --project-ref YOUR_REF` then `npx supabase db push`.

   This creates `drones`, `bookings`, `booking_events`, `notify_me` and `admins`, turns on Row Level Security
   with policies, creates the private `flyers` storage bucket, and seeds all 12 drones.
3. Create your admin login: **Authentication > Users > Add user** (email and password). Turn off public sign ups
   under **Authentication > Providers > Email** if you do not want anyone else creating accounts.
4. Allow that user into the dashboard, either:
   * add the email to `ADMIN_EMAILS` in `.env.local`, or
   * run `insert into public.admins (email) values ('you@example.com');` in the SQL editor.
5. Copy the URL, anon key and service role key into `.env.local` and restart `npm run dev`.

Edit drones in the `drones` table (status `available` or `coming_soon`). If you change `src/lib/drones.ts`,
regenerate the seed with `npm run seed:sql`.

**How security works:** the browser never touches the bookings table. Booking, lookup, payments and admin actions
all go through server routes that use the service role key and check access themselves (lookups need both the
email and the reference; admin routes need a valid Supabase session for an allowed admin). RLS blocks direct
access for everyone else. Flyers are stored privately and shown to admins through short lived signed links.

---

## 4. Resend (email)

1. Create an account at https://resend.com and **verify your sending domain** (add the DNS records it gives you).
2. Create an API key and set `RESEND_API_KEY`, `EMAIL_FROM` and `TEAM_EMAIL`.

Emails sent:
* Customer confirmation for every booking (with the reference and a WhatsApp button)
* Team alert for every booking (full details and a link to the dashboard)
* Status update when an admin changes the status or adds a message
* Payment receipt after a successful Paystack payment

Templates are React Email components in `src/emails/`. In mock mode every email is saved to `.mock_emails/`.

---

## 5. Paystack (naira payments)

1. Get your keys at https://dashboard.paystack.com > Settings > API Keys and Webhooks. Use the `sk_test_` key
   first.
2. Set `PAYSTACK_SECRET_KEY`.
3. Set the **Webhook URL** to `https://YOUR_DOMAIN/api/paystack/webhook`.

Flow: the success screen (or My Bookings) calls `/api/paystack/initialize`, the customer pays on Paystack, returns
to `/pay/callback` which verifies the transaction, and the webhook confirms it again in the background. Both paths
are idempotent, so a payment is only recorded once. A deposit on a pending booking confirms the date; when the total
paid reaches the price the booking moves to **paid**. Every payment emails the customer a receipt.

To test webhooks locally, expose your dev server with a tunnel (for example `npx cloudflared tunnel --url
http://localhost:3000`) and use that URL in the Paystack dashboard.

---

## 6. The 3D drone

The hero renders a detailed procedural foldable camera drone (body, folded arms, four spinning propellers with
blur discs, a three axis gimbal camera, vision sensors and glowing LEDs) with environment reflections, a green rim
light, bloom, a contact shadow, cursor and phone tilt, and scroll driven poses. It loads after first paint and
drops quality automatically on weaker phones and data saver connections.

**To use a real model instead** (recommended once you can download it):

1. Open https://sketchfab.com/3d-models/a67e84ebcec145818e122cdf40705fb0 ("DJI 3 mini Pro" by wishmaster88,
   CC Attribution). Sign in, click **Download 3D Model**, choose **glTF Binary (.glb)**.
   Check the license shown on the page before publishing.
2. Save it as `public/models/drone-source.glb`.
3. Run `npm run optimize:model`. This simplifies the mesh, compresses it with meshopt and converts textures to
   WebP, writing `public/models/drone.glb`.
4. Set `NEXT_PUBLIC_MODEL_CREDIT="DJI 3 mini Pro by wishmaster88 on Sketchfab, CC BY"` so the footer credits the
   author, as the license requires.
5. Restart the server. The hero detects `drone.glb` and uses it; nodes named like `prop`, `blade` or `rotor` spin.

Any other GLB works too. It is scaled and centred automatically.

---

## 7. Content you can add later

* **Gallery:** put photos in `public/gallery/` and list them in `src/lib/gallery.ts`. Until then the section shows
  the shot types you fly as animated flight path diagrams.
* **Reviews:** add real reviews to `src/lib/reviews.ts`. The section shows a designed empty state until then.
* **Copy check:** `npm run check:copy` scans all visible text and email copy for hyphens, dashes and filler words.

---

## 8. Deploy to Vercel

1. Push the `astro-fly` folder to a GitHub repository.
2. On https://vercel.com, **Add New > Project**, import the repo. If the repo root is the parent folder, set
   **Root Directory** to `astro-fly`.
3. Add every variable from section 2 under **Settings > Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to
   your production URL.
4. Deploy. Then update the Paystack webhook URL to the production domain and add your domain in Vercel.

Production check locally: `npm run build && npm start`.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run check:copy` | Hyphen, dash and filler word check for visible copy |
| `npm run optimize:model` | Optimise `public/models/drone-source.glb` into `drone.glb` |
| `npm run seed:sql` | Regenerate the drone seed SQL from `src/lib/drones.ts` |

## Project map

```
src/app/                 pages and API routes
  page.tsx               home (3D hero, drones, how it works, events, shots, reviews, FAQ, contact)
  drones/                list with filters, detail pages
  bookings/              My Bookings lookup (email plus reference)
  chat/  book/  admin/   chat starters, full page booking, team dashboard
  api/                   bookings, lookup, notify, paystack (initialize, verify, webhook), admin
src/components/          booking flow, 3D scene, shell (top bar, tab bar, WhatsApp), sections
src/emails/              React Email templates
src/lib/                 drone data, schemas, formatting; server/ holds Supabase, email, Paystack, mock store
supabase/migrations/     schema, RLS policies, storage bucket, drone seed
docs/research.md         design research takeaways
```

## Credits

DJI product images © DJI, used to show the drones in the fleet. Fonts: Sora, Inter and JetBrains Mono (Google
Fonts, SIL Open Font License).
