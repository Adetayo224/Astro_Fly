# Astro_Fly

Drone shoot booking app for **Astro_Fly**, a service of Samfred Robotics Ltd (Ogbomoso, Nigeria).
Customers pick a drone, fill a four step booking form, pay by bank transfer, and get email confirmations.
The team manages bookings, payments, emails and team access from a protected dashboard at `/admin`.
It installs on Android and iPhone home screens as an app (PWA).

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, shadcn/ui, React Three Fiber
+ drei + postprocessing, Framer Motion, GSAP ScrollTrigger + Lenis, React Hook Form + Zod, Supabase, Resend +
React Email.

---

## 1. Run it locally

Requires Node.js 20.9 or newer.

```bash
cd astro-fly
npm install
cp .env.example .env.local   # then fill in the keys (see section 2)
npm run dev
```

Open http://localhost:3000. To try it on a phone on the same Wi-Fi, open `http://YOUR_COMPUTER_IP:3000`
(the IP is printed as "Network" when the dev server starts).

**Without keys it still runs** in mock mode: bookings are kept in memory, emails are saved as HTML files in
`.mock_emails/`, and `/admin` offers a demo dashboard with sample bookings.

---

## 2. Environment variables

All keys live in `.env.local`, which is never committed. `.env.example` lists every variable.

| Variable | Where to get it | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your live URL | Links in emails |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `orders@samfredrobotics.com` | Shown on the site |
| `NEXT_PUBLIC_DEPOSIT_NGN` | Your choice (default `20000`) | Deposit amount |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project settings > API | Database, storage, admin login |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project settings > API | Admin login in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project settings > API (secret) | Server routes only |
| `RESEND_API_KEY` | resend.com > API Keys | Sending email |
| `EMAIL_FROM` | `Astro_Fly <orders@samfredrobotics.com>` | From address (domain must be verified in Resend) |
| `TEAM_EMAIL` | `orders@samfredrobotics.com` | New booking alerts and replies |
| `ADMIN_EMAILS` | Optional, comma separated | Extra owners outside the team table |
| `NEXT_PUBLIC_MODEL_CREDIT` | Author line for a CC BY 3D model | Footer credit |

---

## 3. Supabase

The app uses the **Samfred Robotics Website** Supabase project, which other Samfred apps share. So every
Astro_Fly object is prefixed and nothing else in the project is touched:

* Tables: `astrofly_drones`, `astrofly_bookings`, `astrofly_booking_events`, `astrofly_notify_me`, `astrofly_team`
* Functions: `astrofly_is_team()`, `astrofly_touch_updated_at()`
* Storage bucket: `astrofly-flyers` (private)

The migrations in `supabase/migrations/` have already been applied to that project. To set up a fresh project,
run them in order in the SQL editor (or `npx supabase db push`).

**Security:** the browser never reads the bookings table. Booking, lookup and admin actions go through server
routes that use the service role key and check access themselves (lookups need both the email and the reference;
admin routes need a signed in member of `astrofly_team`). Row Level Security blocks everyone else. Flyers are
private and shown to the team through short lived signed links.

---

## 4. Team and admin access

* The first owner is **orders@samfredrobotics.com**. To set its password, open `/admin`, click
  **Forgot password or invite link expired?**, enter the email, then open the link from your inbox on the same
  device and choose a password. Links last one hour.
* In the dashboard, the **Team** tab lets owners invite people by email (as admin or owner) and remove them.
  Invited people get an email with a link to set their own password.
* Removing someone only takes away Astro_Fly access. Their login is kept, because the same Supabase login may be
  used by other Samfred apps.
* Invite and password links redirect to `/admin/accept`. When the site goes live, add
  `https://YOUR_DOMAIN/**` under Supabase > Authentication > URL Configuration > Redirect URLs.

---

## 5. Payments (bank transfer)

Customers pay by transfer to **Fidelity Bank, 6060500990, Samfred Robotics LTD**, using their booking reference
(for example `AF2026K7Q2`) as the narration. The details are shown after booking, in My Bookings and in the
emails, with tap to copy and a WhatsApp button to send proof of payment.

When money lands, open the booking in `/admin`, enter the amount under **Record a bank transfer** and press
Record. The customer gets a receipt by email. A deposit on a pending booking confirms the date; once the total
paid reaches the price, the booking moves to **paid**.

(Paystack routes are still in `src/app/api/paystack` if you ever want online card payments. They stay inactive
without `PAYSTACK_SECRET_KEY`.)

---

## 6. Emails

Sent through Resend from `orders@samfredrobotics.com`:

* Customer confirmation for every booking (with bank details when they chose to pay a deposit)
* Team alert to `orders@samfredrobotics.com` for every booking
* Status updates when the team changes the status (the "confirmed" email includes the price and bank details)
* Payment receipts when the team records a transfer
* Free messages written in the dashboard under **Write to the customer**

To switch sending on, create an API key at resend.com (the samfredrobotics.com domain is already verified there,
since Supabase uses it) and set `RESEND_API_KEY` in `.env.local`. Templates are in `src/emails/`.

---

## 7. Install as a phone app

Astro_Fly is a Progressive Web App:

* **Android (Chrome):** an Install button appears in the app, or use the menu > Install app.
* **iPhone and iPad (Safari):** tap Share, then Add to Home Screen. The app shows these steps itself.
* There is an **Install the app** button in the footer and on the Chat page.

Installing needs the site on HTTPS (any Vercel deployment works) or `localhost`.

---

## 8. The 3D drone

The hero renders a detailed procedural foldable camera drone with reflections, a green rim light, bloom, scroll
poses and cursor or phone tilt. It picks a quality tier per device, uses a lighter tier when there is no GPU,
and shows a floating product photo if a device has no WebGL. Add `?quality=low|mid|high` to the URL to force a tier.

To use a real model: download "DJI 3 mini Pro" (CC BY) from
https://sketchfab.com/3d-models/a67e84ebcec145818e122cdf40705fb0 as `.glb`, save it as
`public/models/drone-source.glb`, run `npm run optimize:model`, and set `NEXT_PUBLIC_MODEL_CREDIT`.

---

## 9. Deploy to Vercel

1. Import https://github.com/Adetayo224/Astro_Fly on https://vercel.com.
2. Add every variable from section 2 under Settings > Environment Variables, with `NEXT_PUBLIC_SITE_URL` set to
   the live URL.
3. Deploy, then add the live URL to the Supabase redirect list (section 4).

Production check locally: `npm run build && npm start`.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run check:copy` | Hyphen, dash and filler word check for visible copy |
| `npm run optimize:model` | Optimise a downloaded GLB into `public/models/drone.glb` |
| `npm run seed:sql` | Regenerate the drone seed SQL from `src/lib/drones.ts` |

## Content you can add later

* **Gallery:** photos in `public/gallery/`, listed in `src/lib/gallery.ts`.
* **Reviews:** real reviews in `src/lib/reviews.ts`.
* **Drones:** edit the `astrofly_drones` table (status `available` or `coming_soon`).

## Credits

DJI product images © DJI, used to show the drones in the fleet. Fonts: Sora, Inter and JetBrains Mono
(SIL Open Font License).
