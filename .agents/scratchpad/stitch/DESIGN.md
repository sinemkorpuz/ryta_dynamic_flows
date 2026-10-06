# DESIGN.md — Ryanair App 2026 / Help Hub

Paste this into Stitch after uploading a reference screenshot, so the system is
held as explicit rules rather than re-inferred on every generation.

Hex values are read off the rendered artboards and are approximations.
Replace with the exact Figma tokens before any build work.

## Platform
Mobile, portrait, iOS and Android. Light theme only.

## Colour tokens
- `surface/page` — `#FFFFFF`
- `surface/ai` — `#F2F1FE`  (lavender; reserved exclusively for assistant content)
- `brand/navy` — `#073590`  (header block, primary text, button outlines)
- `brand/yellow` — `#F1C933` (logo, avatar ring, status badges — use sparingly)
- `accent/ai` — `#4B2EDB`   (sparkle avatar, assistant headings)
- `border/hairline` — `#E4E7EC` (1px on white cards)
- `text/heading` — `#10131A`
- `text/body` — `#5B6472`
- `pill/next` — indigo · `pill/review` — amber · `pill/done` — green ·
  `pill/plan` — orange

## Type scale
- Greeting — 32px / bold
- Section heading — 22px / bold
- Card title — 16px / semibold
- Body and meta — 13–14px / regular / `text/body`
- Overline — 11px / uppercase / letter-spacing 0.08em / `brand/navy` on a pale
  blue pill

## Shape and spacing
- Screen side padding — 20px
- Card radius — 12px · AI panel radius — 18px · Buttons — fully rounded pills
- Navy header has a rounded bottom edge; the white body sheet overlaps it with
  rounded top corners
- Vertical rhythm between sections — 16–24px

## Components
- **App header** — navy block; yellow harp logo, greeting, one-line subtitle,
  circular avatar with yellow ring, bell icon.
- **AI search bar** — white pill, iridescent gradient border, menu icon left,
  circular submit right.
- **Overline + entity card** — pale blue uppercase label above a white card
  with leading icon, bold title, grey meta line, yellow status badge.
- **AI insight panel** — lavender surface, indigo sparkle avatar, indigo bold
  heading in the first person, one grey supporting sentence, then nested white
  cards inside the panel.
- **Task card** — leading icon, title, status pill, one-line description,
  outlined blue pill button.
- **Numbered suggestion row** — pale blue numbered circle, bold question, grey
  subtitle, chevron.
- **Full-width outlined pill** — used for "See all … →" demotion links.
- **Bottom tab bar** — four icons.

## Rules
1. Lavender is only ever used for assistant-generated content. Never for
   ordinary cards.
2. The assistant writes in the first person and is never labelled "AI".
3. Prices are large and unambiguous. Never truncate or abbreviate them.
4. Decline and skip actions are real, visible buttons. Never greyed out,
   never hidden behind a chevron.
5. Nothing is pre-selected on the user's behalf.
6. Lower-confidence content collapses behind a "See all … →" row rather than
   disappearing.
