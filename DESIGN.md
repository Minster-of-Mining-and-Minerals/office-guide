---
name: MoM Digital Signage
description: Ministry of Mining digital signage — bilingual wayfinding and announcements for public kiosks and an admin control surface.
colors:
  highland-petrol: "#0b3b5c"
  ministry-brass: "#b8891f"
  classic-brass: "#ffbf00"
  soft-brass: "#f5b444"
  metallic-brass: "#ec9f18"
  ink: "#0a0a0a"
  paper: "#ffffff"
  quiet-surface: "#f5f5f5"
  hairline: "#e5e5e5"
  muted-ink: "#737373"
  destructive: "#ef4444"
  success: "#0c6b3e"
typography:
  display:
    fontFamily: "var(--font-geist-sans), 'Geist Sans', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4vw + 1rem, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2vw + 0.75rem, 2rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "var(--font-geist-sans), var(--font-noto-ethiopic), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
  amharic-body:
    fontFamily: "var(--font-noto-ethiopic), 'Noto Sans Ethiopic', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "16px"
  "2xl": "24px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.highland-petrol}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-brass:
    backgroundColor: "{colors.ministry-brass}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ministry-brass}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  chip:
    backgroundColor: "{colors.quiet-surface}"
    textColor: "{colors.highland-petrol}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  sidebar-item:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.highland-petrol}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  sidebar-item-active:
    backgroundColor: "{colors.ministry-brass}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
---

# Design System: MoM Digital Signage

## 1. Overview

**Creative North Star: "The Federal Concierge"**

The system reads as an unmistakably state-run institution that has taken the trouble to welcome you. Every surface is warm enough for a citizen unfamiliar with digital wayfinding to feel invited, and formal enough that no one mistakes it for a startup product. Officialdom is a floor, not a ceiling: the Ministry's authority sits in the confidence of the type, the depth of Highland Petrol on the sidebar, the honest weight of Ministry Brass on primary actions — never in ornament, seals, or theatre.

The identity is carried by two colors, one script pair, and generous whitespace. Highland Petrol grounds the interface as a state-run touchpoint; Ministry Brass earns its place on the ~10% of surface that carries the decision. Nothing else needs to shout. Amharic Fidel is a first-class language throughout — its own line-height, its own comfortable size, never crammed into metrics tuned for Latin.

This system explicitly rejects the generic dark-gradient SaaS dashboard, the 2005-era government intranet, fake-corporate ministry aesthetics (stock handshakes, generic globes, everything-blue), any "Africa cliche" ornamentation (acacia trees, giraffes, decorative "traditional" patterns applied as texture), Web3 / crypto energy, startup cheerfulness, and the AI-slop defaults (Inter font, purple gradients, nested cards, tiny gray text on tinted white). If a page looks like it came from a generic AI generator, it has failed.

**Key Characteristics:**
- Bilingual by construction — English and Amharic Fidel are equal-weight throughout.
- Two-color identity — Highland Petrol carries the surface, Ministry Brass carries the decision.
- Flat by default — depth is a state response, not a resting condition.
- Kiosk-native — the public screen isn't a shrunken desktop; it's built for 2–3 metre viewing.
- Craft signals care — spacing, typography, and motion demonstrate the ministry's respect for its citizens.

## 2. Colors

The palette is intentionally small: two identity colors and a quiet neutral field. Restraint is the point — every additional color would dilute Highland Petrol's authority and Ministry Brass's occasion.

### Primary
- **Highland Petrol** (`#0b3b5c`, canonical `hsl(201, 85%, 18%)`): the surface color that says "state institution". Used on the sidebar, primary text, and headers. Deep enough to feel weighty, saturated enough to feel intentional, and cool enough to balance the warm brass. Never used on decorative surfaces or backgrounds outside chrome — its role is anchoring, not filling.

### Secondary
- **Ministry Brass** (`#b8891f`, canonical `hsl(45, 80%, 40%)`): the decision color. Applied to primary calls-to-action, active navigation, and any element that carries the visitor's or admin's next move. Descended from the ministry's actual brand palette, kept restrained: appears on ≤ 10% of any given screen.

### Tertiary
- **Classic Brass** (`#ffbf00`, canonical `hsl(45, 100%, 50%)`): the accent-on-accent variant, reserved for badge treatments, highlight rings, and moments of celebration (successful actions, active states with reinforcement). Never as a fill for large surfaces.
- **Soft Brass** (`#f5b444`) and **Metallic Brass** (`#ec9f18`): the intermediate steps used for hover treatments, muted panels, and gradient bands (e.g. the appearance-page header wash). Read as members of the same brass family, not as new colors.

### Neutral
- **Paper** (`#ffffff`): the surface field. Almost every card, panel, and table sits on Paper.
- **Ink** (`#0a0a0a`): body text at maximum contrast. Reserved for prose; UI chrome uses Highland Petrol instead.
- **Quiet Surface** (`#f5f5f5`): secondary panels, muted backgrounds, tabbed switcher tracks. Never used as a card background — it's a mid-layer, not a resting surface.
- **Hairline** (`#e5e5e5`): borders and dividers. Never as a fill.
- **Muted Ink** (`#737373`): secondary text, timestamps, helper prose. Kept above 4.5:1 against Paper.

### Named Rules

**The Two-Color Rule.** Highland Petrol carries surface identity, Ministry Brass carries the decision. Everything else is neutral. If a design needs a third color, the answer is either weight, size, or a rule change — never a new hue.

**The One Voice Rule.** Ministry Brass appears on ≤ 10% of any given screen. Its rarity is the point. When a design shows brass on multiple cards, on borders, on chips, and on buttons in the same view, the surface has been diluted; strip it back to the single most important call-to-action.

## 3. Typography

**Display Font:** Geist Sans (with `ui-sans-serif`, `system-ui`, `sans-serif` fallbacks)
**Body Font:** Geist Sans for Latin, Noto Sans Ethiopic for Amharic Fidel
**Character:** A humanist-geometric hybrid that reads as modern without becoming trendy. Geist is Vercel's family — chosen here because it retains a warm, human proportion at UI sizes without any of the sterile geometric coldness that dates a system in two years. Noto Sans Ethiopic is Google's Ethiopic family, treated as a first-class citizen: it renders Amharic Fidel with the same care that Geist gives to Latin. Both are loaded via `next/font` and mounted as CSS variables so the correct family activates based on `html[lang]`.

### Hierarchy

- **Display** (weight 600, `clamp(2.25rem, 4vw + 1rem, 3.75rem)`, line-height 1.1, letter-spacing -0.02em): reserved for kiosk hero moments and page identity blocks — never for form headers.
- **Headline** (weight 600, `clamp(1.5rem, 2vw + 0.75rem, 2rem)`, line-height 1.2, letter-spacing -0.01em): page titles ("Dashboard", "Announcements", "Display").
- **Title** (weight 600, 1.125rem, line-height 1.35): card titles, section leaders, table headers.
- **Body** (weight 400, 1rem, line-height 1.55): the default paragraph and control label size. Line length capped at 65–75ch for prose.
- **Label** (weight 600, 0.6875rem, line-height 1, letter-spacing 0.14em, uppercase): the small kicker used on section markers ("CONTENT", "PUBLIC SCREEN"). Deliberately rare — see Named Rules below.
- **Amharic Body** (Noto Sans Ethiopic, weight 400, 1.0625rem, line-height 1.7): Amharic Fidel gets its own body ramp. The `+1px` size and `+0.15` line-height are not arbitrary — Fidel glyphs are visually taller than Latin at the same nominal point size, and their descenders + inherent complexity need the extra vertical breathing room to read at UI speed.

### Named Rules

**The Bilingual Parity Rule.** Amharic Fidel and Latin are equal-weight throughout. Fidel is never smaller, never lower-contrast, never in a "fallback" font stack. When both languages appear side by side (offices with `name_am` alongside `name`), both get equal typographic weight; when only Amharic renders (user has toggled locale to `am`), the entire surface must read as native, not translated.

**The Kicker Restraint Rule.** The uppercase Label is reserved for structural section headers (sidebar section names, table column headers). Placing a small uppercase kicker above every content section is the current AI grammar tell — this system refuses it. Structure earns the label; ornament doesn't.

## 4. Elevation

The system is **flat by default**. Surfaces sit flush on Paper; identity comes from color, spacing, and border-radius, not from shadow vocabulary. Shadows are a *state response*, not a resting condition — they exist to acknowledge an interaction, never to imply an unearned three-dimensionality.

### Shadow Vocabulary

- **State response** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): appears on interactive card hover, giving the surface a subtle lift as the pointer meets it. Never present at rest.
- **Floating chrome** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.10)`): reserved for dialogs, dropdowns, and popovers that must visibly escape the document flow.
- **Inner well** (`box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)`): the live-preview frames on the theme page and any container that reads as "inset canvas" rather than "raised card".

### Named Rules

**The Flat-By-Default Rule.** Every surface starts flat. If a component needs elevation, the reviewer's question is not "what shadow?" but "what state is this responding to?" Elevation is earned by interaction (hover, focus, active) or by legitimately escaping the document flow (dialog, popover) — never by design reflex.

**The No Nested Cards Rule.** A raised surface inside another raised surface is always wrong. If content needs grouping inside a card, use spacing, a thin hairline, or a Quiet Surface panel — never a second card.

## 5. Components

### Buttons

- **Shape:** Rounded corners (radius `lg`, 10px). Never full-round unless the button is a genuine icon-only affordance.
- **Primary** (`button-primary`): Highland Petrol background with Paper text. Padding 10px × 20px. Used for the single most important action in a view.
- **Brass Primary** (`button-brass`): Ministry Brass background with Paper text. Padding 10px × 20px. Reserved for "commit" moments — Save, Publish, Confirm — where the brass carries the weight of a Ministry decision.
- **Outline / Secondary**: Paper background with Ministry Brass text and a 1px `border-color` on Ministry Brass at 40% opacity. Used for reversible actions ("Cancel", "Revert").
- **Hover:** Primary buttons darken toward Ink; Brass buttons darken toward `hsl(45, 80%, 34%)`. No transform, no shadow — the color shift is the affordance.
- **Focus:** 2px ring in Ministry Brass at 40% opacity, offset by 2px. Never a browser-default focus outline.

### Cards / Containers

- **Corner Style:** Extra-large (`2xl`, 24px) for major panels; `xl` (16px) for compact cards and internal panels.
- **Background:** Paper.
- **Border:** 1px Ministry Brass at 25% opacity — a "hairline gold" that reads as a ministerial mat, not a decorative frame.
- **Internal Padding:** 20–24px on mobile-sized cards; 32px on desktop feature panels.
- **Shadow Strategy:** None at rest. See Elevation section for state responses.

### Inputs / Fields

- **Style:** 1px Hairline border, Paper background, radius `md` (8px), padding 8px × 12px.
- **Focus:** Border shifts to Ministry Brass; a 3px ring in Ministry Brass at 40% opacity appears. No glow, no colored fill.
- **Error:** Border shifts to Destructive with a matching 3px ring. An inline 11px error line appears below the field in Destructive.
- **Bilingual paired fields:** English input on the left, Amharic input on the right, equal-width columns, matching typographic scale. The Amharic input uses the Amharic Body font stack automatically.

### Chips

- **Style:** Quiet Surface background, Highland Petrol text, radius `full`, padding 4px × 10px.
- **Active state:** Ministry Brass background, Paper text.
- **Filter chips** (used on the office guide, floor selectors): show a small selected-count badge inline when multiple are active; never a floating badge overlay.

### Navigation (Sidebar)

- **Base:** Paper background, sidebar sits floating with `rounded-2xl` corners inside a small margin from the viewport edge.
- **Menu items:** 12px × 20px padding, radius `md`, Highland Petrol text on Paper at rest.
- **Hover:** Metallic Brass background (a soft golden tint), Highland Petrol text preserved.
- **Active:** Ministry Brass background, Paper text. The brass says "you are here" — one item per section is active at a time.
- **Section labels:** the uppercase Label typography, Highland Petrol at 60% opacity, letter-spaced. Zero visual weight, maximum structural weight.
- **Collapse-to-icon:** the sidebar can collapse to a 4rem icon column; every item remains reachable via its Lucide icon.

### Signature: Bilingual Paired Field

The pattern that lives on every content-management surface (floors, offices, announcements). Two identical inputs sit side-by-side — the left labelled with the English field name (`Name`), the right labelled with the Amharic equivalent (`ስም`). Both use the same input style; the right side switches its `font-family` to Noto Sans Ethiopic automatically via `dir` or explicit class. There is no visual "primary" language — parity is the point.

### Signature: Office Guide Card

The office card on the public kiosk. Highland Petrol title (office name at ~1.5rem to be legible from 2–3m), Ministry Brass floor / office-number badge, Ink secondary line (services offered), and a hairline Ministry Brass border. Everything sized for glanceability, not density — a visitor should recognize their target office at a glance, not by careful reading.

## 6. Do's and Don'ts

### Do:
- **Do** use Highland Petrol as the surface identity color (sidebar, primary text, headers) and Ministry Brass strictly for the decision (primary CTA, active nav item, published-status indicator).
- **Do** treat Amharic Fidel as a first-class language: same visual weight, its own line-height and size ramps, native font stack via `next/font`.
- **Do** cap body prose line length at 65–75ch — including on the kiosk, where wider blocks become harder to scan across the room.
- **Do** ensure body text hits ≥4.5:1 contrast (WCAG AA); ≥7:1 (AAA) is the target across both admin and kiosk surfaces.
- **Do** use `text-wrap: balance` on H1–H3 for even line lengths, and `text-wrap: pretty` on long prose to reduce orphans.
- **Do** respect `prefers-reduced-motion` on every animated element — every animation must have a defined stationary alternative.
- **Do** verify contrast against the *ambient light* expected in the ministry lobby, not just the WCAG ratio in isolation. The kiosk's contrast in a bright lobby is not the same as in a dark office.

### Don't:
- **Don't** use a purple gradient hero, an Inter body font, nested cards, or tiny gray body text on a tinted near-white background. That specific combination is the AI-slop default that PRODUCT.md forbids.
- **Don't** style this like a generic dark-gradient SaaS dashboard (Vercel / Stripe / Linear / crypto-tool aesthetic). This is a state institution, not a startup.
- **Don't** revert to the 2005-era government intranet template — no tiny 11px body text, no blue underlined links as a default, no tables inside tables.
- **Don't** decorate with "Africa cliche" motifs — no acacia trees, no giraffes, no traditional patterns applied as ornamental texture. Ethiopian identity carries through language, script, and content, never through decoration.
- **Don't** use gradient text (`background-clip: text` with a gradient background). Decorative, never meaningful. Emphasize via weight or size instead.
- **Don't** use glassmorphism as a default. Blurs and glass surfaces are rare and purposeful, or they don't appear at all.
- **Don't** use `border-left` (or `border-right`) greater than 1px as a colored accent on cards, list items, or callouts. Always rewrite with a full hairline border, a background tint, a leading icon, or nothing.
- **Don't** stack cards inside cards. If a card needs internal grouping, use spacing or a Quiet Surface panel — never a second card.
- **Don't** put a small uppercase kicker above every content section (the "ABOUT" / "PROCESS" / "PRICING" pattern). Structural section labels earn it; ornamental ones don't.
- **Don't** use numbered section markers as scaffolding (01 / 02 / 03) unless the section genuinely IS a sequence and the order carries information.
- **Don't** ship a "Corporate government" aesthetic (stock handshake photos, generic globe icons, everything-blue). PRODUCT.md names this as an anti-reference by name.
- **Don't** pair Geist with a similar-but-not-identical geometric sans (e.g. Inter, Manrope, DM Sans). If a second family is ever needed, pair on a contrast axis (serif + sans, or geometric + humanist), or use Geist in multiple weights.
- **Don't** animate CSS layout properties (`width`, `height`, `top`, `left`) unless truly needed. Transform and opacity only, with `ease-out-quart` / `quint` / `expo` easing curves — never bounce, never elastic.
- **Don't** ship any surface that looks like a generic AI generator produced it. If someone could look at a page and say "AI made that" without doubt, it has failed — even if every WCAG rule is satisfied.
