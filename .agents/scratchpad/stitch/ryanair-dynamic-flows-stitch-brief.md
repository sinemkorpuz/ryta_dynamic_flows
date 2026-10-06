# Ryanair — Dynamic Ancillary Flows
## Customer journey + Stitch design brief

Use case: AI scores every ancillary at the moment a passenger enters check-in,
ranks them by purchase likelihood, strips out ineligible products, and a page
builder assembles 1–2 offer pages instead of the fixed linear carousel.

KPI: higher ancillary conversion, fewer skipped pages, faster check-in completion.

---

## 1. The running example (one passenger, one trip)

**Marta Byrne, 34.** Dublin (DUB) → Faro (FAO), return, 7 nights.
Travelling with her partner and two children (ages 6 and 9). School half-term.

| Signal | Value |
|---|---|
| Purchase history | Priority & 2 Cabin Bags on 3 of last 4 trips. Never bought insurance or car hire. Bought a 20kg bag once, on a 10-night trip. |
| Route | DUB–FAO, leisure/beach, high family mix |
| Journey type | Return, both legs booked |
| Pax mix | 2 adults + 2 children (child seat allocation rules apply) |
| Fare | Value fare |
| Trip length | 7 nights |
| Current booking | No seats reserved, no bags, no extras |
| Context | Check-in opened 48h before departure, on mobile, 21:40 local |

**Why this persona:** she is a repeat ancillary buyer with a clear habit
(Priority), a strong unbought need (4 seats together with kids), and a weak
long tail (insurance, transfers). That makes every mechanic in the flow visible
in one journey.

---

## 2. What the model does before the first screen renders

Scoring runs once, server-side, in under 300ms while the check-in screen loads.

**Ranked by purchase likelihood:**

| Rank | Ancillary | Score | Top driver |
|---|---|---|---|
| 1 | Priority & 2 Cabin Bags | 0.84 | Repeat purchase, 3 of last 4 trips |
| 2 | Reserved seats × 4 (together) | 0.71 | Pax mix: 2 children, no seats held |
| 3 | 20kg checked bag | 0.58 | Trip length 7 nights, family of 4 |
| 4 | Car hire | 0.29 | Route FAO, leisure — but never purchased |
| 5 | Fast Track security | 0.14 | — |
| 6 | Travel insurance | 0.11 | Never purchased, 6 prior declines |
| 7 | Airport transfer | 0.08 | — |
| 8 | Flexi fare upgrade | 0.04 | — |

**Business rules then remove:**
- Fast Track — not sold at FAO on the return leg → **removed entirely**
- Flexi upgrade — not eligible inside 48h of departure → **removed entirely**
- Travel insurance — 6 consecutive declines, suppression rule active → **removed for this journey**
- Airport transfer — below the 0.10 display floor → **removed**

**Page builder output:** 2 pages, not 7.
- Page 1 → Priority (rank 1) + Seats (rank 2), both above the fold
- Page 2 → Checked bag (rank 3), with Car hire (rank 4) collapsed into a
  single "More extras" drawer
- Everything else never renders

---

## 3. Screen-by-screen journey

### Screen 1 — Check-in start
Marta taps "Check in" on the DUB–FAO outbound. She sees the four passengers on
the booking with avatars, flight time, and a single primary button. A thin
progress bar at the top reads **"2 steps to your boarding passes"** — the count
is dynamic and comes from the page builder, not hardcoded.

### Screen 2 — Preparing your check-in (transient, ~1s)
Skeleton loading state. Microcopy: *"Getting your trip ready."* No mention of
scoring or AI. This screen exists so the offer pages never render half-built.

### Screen 3 — Offer page 1 of 2: "Your usual, ready to go"
Two stacked cards.

- **Card A — Priority & 2 Cabin Bags.** Flagged as a repeat purchase:
  *"You added this on your last 3 trips."* Price for 4 passengers, with a
  single toggle that applies it to all four at once and a small "choose who"
  link underneath. Pre-attention state only — nothing is pre-selected.
- **Card B — Sit together.** A compact seat-map thumbnail showing 4 seats in a
  row, with the honest framing: *"Seats are assigned free at check-in, but
  you may be split up. Reserve row 12 for your family."* Price shown as a
  total for 4, not per seat.

Secondary action at the bottom: **"No thanks, continue"** — same visual weight
rules as the primary, no greyed-out dark pattern.

### Screen 4 — Seat map (conditional, only if Card B is tapped)
Full seat map with the AI's recommended block (12A–12D) already highlighted and
labelled *"Best row for your group."* Child-seating rules are enforced visually:
rows that can't take a 6-year-old are greyed with a short reason on tap.
Running basket total pinned to the bottom.

### Screen 5 — Offer page 2 of 2: "Anything in the hold?"
One card plus one drawer.

- **Card C — 20kg checked bag.** Contextual line: *"7 nights, 4 travellers —
  most families on this route add one bag."* Quantity stepper, not a toggle.
- **Collapsed drawer — "More extras (1)".** Tapping it reveals Car hire in
  Faro. It stays closed by default because the score fell below the
  promote-to-card threshold.

### Screen 6 — Skip path (what happens if she declines)
If Marta taps "No thanks" on page 1, she is **not** re-asked. Page 2 still
renders (different product family), but a declined item never returns in the
same session. No interstitial "Are you sure?" modal.

### Screen 7 — Review and pay
Line items: Priority ×4, Seats 12A–12D, Checked bag ×1. Each has an inline
"remove" affordance. Total, payment method on file, one-tap confirm.
If she added nothing, this screen is skipped entirely.

### Screen 8 — Boarding passes
Four boarding passes in a swipeable stack with the purchased extras shown as
badges on each pass (PRIORITY, 12A). Add-to-Wallet. A quiet single line at the
bottom: *"Changed your mind? Manage extras."*

### Screen 9 — Empty state (design it, it will happen)
Everything was ineligible or below threshold → zero offer pages. Marta goes
from Screen 1 straight to Screen 8. The progress bar reads "1 step."

### Screen 10 — Internal: model feedback loop (optional companion screen)
A simple ops dashboard tile: offers shown vs. taken, pages per check-in,
median time to boarding pass, and conversion delta vs. the static flow. This is
the "model learns from the outcome" step made visible for the business
stakeholders.

---

## 4. Copy-paste Stitch prompt — app level

> Design a mobile app flow for a low-cost airline check-in experience, called
> Dynamic Check-in. It is a native-feeling mobile app, portrait, iPhone size.
>
> The core idea: instead of showing every optional extra in a fixed sequence of
> seven pages, the app personalises and compresses the extras into one or two
> pages based on what this passenger is most likely to buy.
>
> Visual style: light theme on a white background. A navy blue header block
> with rounded bottom corners and a small yellow harp logo. White cards with
> 1px hairline grey borders and 12px corners. Outlined navy pill buttons.
> Brand yellow used sparingly, only for status badges. A distinct pale
> lavender surface reserved exclusively for assistant-generated content, with
> an indigo sparkle avatar and indigo headings written in the first person.
> Bold sans-serif headings, generous whitespace, large tap targets. Prices are
> always large and unambiguous. Decline actions are clearly visible and never
> hidden or greyed.
>
> The passenger is Marta Byrne, flying Dublin to Faro with her partner and two
> children, aged 6 and 9, for 7 nights. She has bought Priority Boarding on
> three of her last four trips and has never bought travel insurance.
>
> Create these screens: check-in start with four passengers; a short loading
> state; offer page 1 of 2 with a Priority and 2 Cabin Bags card marked as a
> repeat purchase and a "sit together" seat card showing a 4-seat row; a full
> seat map with a recommended family row highlighted; offer page 2 of 2 with a
> checked bag card and a collapsed "More extras" drawer; a review and pay
> screen with removable line items; a boarding pass stack with extras shown as
> badges on each pass; and an empty state where no extras are offered at all
> and the passenger goes straight to boarding passes.
>
> Show a progress indicator at the top of every step that says how many steps
> remain, and make it clear that the number of steps is small.

## 5. Copy-paste Stitch prompts — per screen

> **Superseded for visual style.** The per-screen prompts below were written
> before I had the real designs. They describe a dark navy/yellow theme, which
> is wrong — the App 2026 Help Hub is light theme. Use the rewritten prompts
> in `ryanair-help-hub-stitch-inputs.md` §6, which match the actual system.
> The *structure* and *flow logic* below still stand.

**Screen 1**
> Check-in start screen. Flight header: Dublin DUB to Faro FAO, Tuesday, 06:35.
> Four passenger rows with initials avatars: Marta B, Declan B, Fia B (child),
> Oisín B (child). Top progress bar reading "2 steps to your boarding passes".
> Large yellow primary button "Start check-in".

**Screen 3**
> Offer page, labelled "1 of 2" in the progress bar. Heading "Your usual,
> ready to go". Two white cards on navy. First card: Priority & 2 Cabin Bags,
> with a small yellow pill reading "You added this on your last 3 trips",
> a price of €76 for 4 passengers, a large toggle, and a small link "Choose who
> gets it". Second card: "Sit together", with a small illustration of four
> seats side by side in a row, supporting text "Seats are assigned free at
> check-in, but your family may be split up", price €24 for 4 seats, and a
> button "Choose seats". At the bottom a clearly visible text button "No
> thanks, continue".

**Screen 4**
> Seat map screen for a Boeing 737. Rows of seats, four adjacent seats in row
> 12 highlighted in yellow with a label "Best row for your group". Some rows
> greyed out as unavailable for children. Sticky bottom bar showing running
> total €24 and a yellow "Confirm seats" button.

**Screen 5**
> Offer page, labelled "2 of 2". Heading "Anything in the hold?". One white
> card: 20kg Checked Bag, €39.99, with a quantity stepper set to 0, and a
> supporting line "7 nights, 4 travellers — most families on this route add one
> bag". Below it a collapsed grey row reading "More extras (1)" with a chevron.
> At the bottom a visible text button "No thanks, continue".

**Screen 7**
> Review and pay screen. List of line items with small remove icons: Priority &
> 2 Cabin Bags ×4 €76.00, Seats 12A–12D €24.00, Checked bag 20kg €39.99. Total
> €139.99 in large type. Saved Visa ending 4412. Large yellow button "Pay and
> get boarding passes".

**Screen 8**
> Boarding pass screen. A swipeable stack of four boarding passes, the front
> one for Marta Byrne, seat 12A, with a QR code, and two small badges reading
> "PRIORITY" and "12A". Dot indicator showing 1 of 4. "Add all to Apple Wallet"
> button. Small text link at the bottom "Changed your mind? Manage extras".

**Screen 9**
> Boarding pass screen reached directly from check-in, with a progress bar that
> read "1 step". Same boarding pass stack, no offers shown anywhere.

**Screen 10**
> Internal analytics dashboard, light theme, desktop. Four KPI tiles: Ancillary
> conversion 24.1% up 6.3 points, Pages per check-in 1.8 down from 4.6, Median
> time to boarding pass 71 seconds down from 2 minutes 14, Offers shown per
> passenger 2.4. Below, a bar chart of take-up by ancillary type and a table of
> the top ranked offers with their scores.

---

## 6. Design decisions worth defending in the review

1. **Never pre-select.** Every card starts off. The lift comes from ranking and
   compression, not from opt-out defaults.
2. **Decline is a first-class action.** "No thanks, continue" is a real button
   on every offer page. The KPI is *fewer skipped pages*, which you win by
   showing fewer pages — not by making skipping harder.
3. **Say why, briefly.** "You added this on your last 3 trips" is the single
   highest-value piece of copy in the flow. It converts and it explains the
   personalisation without saying the word "AI".
4. **Step count is honest and visible.** Telling someone there are 2 steps left
   is what makes check-in *feel* faster, which is half the KPI.
5. **Design the zero-offer state first.** If the rules strip everything, the
   flow must be beautiful at one step. That state is the proof the system is
   genuinely dynamic.
6. **The drawer is the demotion mechanic.** Low-ranked but eligible products
   collapse rather than disappear, so the model keeps getting a weak signal to
   learn from without costing a page.
