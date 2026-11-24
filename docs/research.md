# Research takeaways

Short study of premium product and booking experiences before designing Astro_Fly:
DJI.com product pages and the DJI Fly app, Apple product pages, the Airbnb booking flow,
Uber, Revolut, Linear, Vercel, dark drone sites on Awwwards (AeroMate, USAvionix, Dronefall)
and Dribbble / Mobbin shots for rental and dark booking apps.

## 1. One hero object, lit like a studio product
DJI and Apple put a single product in the middle of a near black stage, lit with a soft key
light and a thin rim light so the silhouette separates from the background. No clutter
around it. Copy sits in a quiet layer above.
**Applied:** the 3D drone floats alone in the hero with a green rim light, environment
reflections and a contact shadow. Headline and buttons live in one frosted glass panel.

## 2. Scroll moves the product, not just the page
Apple and the Awwwards drone sites pin the product while text changes around it, so the
scroll feels like a camera move.
**Applied:** the hero stage is sticky. As you scroll, the drone flies to new poses
(banks, climbs, turns to show the gimbal) while a second panel takes over.

## 3. Telemetry as decoration that earns its place
DJI Fly shows altitude, battery and signal in small monospace readouts with tight labels.
It reads as technical without shouting.
**Applied:** monospace HUD readouts (ALT, BAT, SIG, GPS) that count up once, thin grid
lines, and corner brackets on key panels. Used sparingly so the page never feels busy.

## 4. Booking is a short conversation, one question group per screen
Airbnb and Uber split a booking into a few calm steps with a sticky summary and one clear
primary action at the bottom. Progress is always visible.
**Applied:** four steps in a full screen sheet on phones and a side panel on desktop, an
animated progress bar, a sticky bottom action bar, and tappable chips instead of dropdowns
wherever the options are few.

## 5. Native feel comes from motion physics and touch targets
Revolut and Uber use springs (not linear easing), bottom sheets you can drag down, 44px+
touch targets and instant press feedback.
**Applied:** spring bottom sheets with drag to dismiss, scale on press for every button,
a bottom tab bar on phones, skeleton loaders while data loads.

## 6. Restraint in colour, discipline in type
Linear and Vercel run almost monochrome UIs and spend a single accent colour on what
matters: the main action, the active state, progress.
**Applied:** black, graphite and soft white carry the layout. Electric green is reserved for
glows, the active tab, progress and the main buttons. Sora for headings with tight
tracking, Inter for body, JetBrains Mono for readouts, on a fixed type scale.

## 7. Honest empty states beat fake social proof
Strong product sites show real proof or nothing. Invented testimonials and numbers are the
fastest way to look generic.
**Applied:** the reviews section ships empty with a designed empty state. The gallery
shows the actual shot types we fly as animated flight path diagrams until real photos are
added. No invented statistics anywhere.

## 8. Copy that sounds like people
The best studios write short, specific sentences. No filler adjectives.
**Applied:** plain, warm copy in the voice of a Nigerian creative studio: what you get, when,
and how to reach a real person on WhatsApp. No dashes or hyphens in visible text.
