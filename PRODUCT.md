# Product

## Register

product

## Platform

web

## Users

Two distinct audiences share this system.

Ministry staff are the primary hands-on users. They open the admin dashboard on a desktop browser during working hours to keep the signage current: adding or renaming floors, updating an office's contact person, publishing announcements, adjusting appearance settings. They come to the interface with a specific task in mind and want to finish it. Fluent density and predictable admin patterns beat visual flourish; time-on-page is a cost, not a KPI.

Walk-in visitors are the secondary audience — passive but publicly visible. They stand in the ministry lobby at roughly 2–3 metres from a wall-mounted screen, sometimes glancing while waiting, sometimes deliberately searching for the office relevant to their errand. They are not "users" in the interactive sense: they cannot type or click. Their job on the surface is to find their office and move on. Legibility across a room, in variable natural and artificial light, is non-negotiable.

## Product Purpose

Digital signage for Ethiopia's Ministry of Mining that replaces printed directories and reception-desk lookups with a live, bilingual, always-current source of truth. The office guide answers "where do I go?" and the announcement carousel broadcasts ministry-wide information. When an office moves, its contact person changes, or a new announcement is posted, every kiosk in the building reflects the change immediately.

Success looks like a visitor who arrives, glances at the wall, and walks confidently to the right room without asking for help — and a Ministry admin who publishes a change in under a minute without having to reprint or redistribute anything.

## Positioning

Real-time bilingual (English + Amharic) updates on every ministry display. Change office information once; the room reflects it instantly, without reprinting, without redistributing, and without an English-first afterthought where Amharic is squeezed in.

## Brand Personality

The system should feel modern and trustworthy without pretending to be a startup, and warm without abandoning the authority a federal ministry carries. Officialdom is a floor, not a ceiling — visitors should read the surface as unmistakably state-run, yet welcoming enough that a citizen unfamiliar with digital wayfinding still feels invited. Efficiency shows up as respect for the admin's time; premium craft shows up as respect for the visitor's attention. The seven words the founding team named: modern, official, welcoming, efficient, premium, warm, trustworthy.

## Anti-references

This system is emphatically not any of the following, and the visual language should keep visible distance from all of them:

- Generic dark-gradient SaaS dashboards (Vercel, Stripe, crypto-tools) — this is a government service, not a startup product.
- The 2005-era government intranet template with tiny text, blue underlined links, and tables nested inside tables.
- Fake-corporate government aesthetics: stock photos of handshakes, generic globe icons, everything-blue.
- "Africa cliche" ornamentation: acacia trees, giraffes, over-decorated "traditional" patterns pasted on as visual filler. Ethiopian heritage shows up in language, script, and content, never as texture.
- Web3 / crypto energy: neon gradients, glassmorphism, gradient text.
- Startup cheerfulness: cartoon illustrations, playful emojis, marketing-hype microcopy in an admin surface.
- The full AI-slop default: Inter font, purple gradient, nested cards, tiny gray body text on a tinted near-white background. If a page looks like it came from a generic AI generator, it has failed.

## Design Principles

The following are confirmed commitments. Additional principles can be appended below as the team clarifies them during actual page work.

Bilingual is a default, not a translation layer. English and Amharic are equal-weight throughout — both languages get first-class typography (line-height, size, font stack), both are supported in every admin field, and switching languages never degrades a surface into a lesser version of itself.

Clarity over cleverness. A visitor should understand what to do — or where to go — within three seconds of glancing at a screen, without needing an explanation, a scroll, or a second interaction. Every added visual element must earn its place against this bar.

<!--
Team: add more principles here as they crystallize. Good principles are
strategic (guide decisions), not visual (colors, radii, fonts belong in
DESIGN.md). Examples of what a good principle looks like: "practice
what you preach", "show don't tell", "expert confidence".
-->

## Accessibility & Inclusion

The target is WCAG 2.1 AAA across both admin and public surfaces, with AA as the non-negotiable floor. AAA is a government-service commitment, not a stretch goal: the ministry serves every citizen, including those with low vision, motor limitations, or non-standard input devices.

The public kiosk carries additional obligations beyond WCAG's per-pixel rules. Body copy must be legible at 2–3 metres viewing distance, which puts a hard floor under type sizes and line lengths regardless of what the specification technically permits. Contrast is verified against both the digital screen and the ambient light expected in a ministry lobby, not just the WCAG ratio in isolation.

Amharic Fidel script is treated as a first-class typographic citizen: it gets its own line-height and size ramps rather than inheriting metrics tuned for Latin glyphs. Reduced-motion preferences are honored in every animated element on both surfaces, and any decorative motion has a defined stationary alternative.
