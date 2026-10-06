# Stitch build runbook
## Ryanair — Dynamic Ancillary Flows, in the App 2026 Help Hub design language

Everything you need in one file. Work top to bottom. Each step says what to
do, what to paste, and what you should see before moving on.

Budget: ~20 Pro generations. Allow 60–90 minutes.

---

## Before you start

Have these three things to hand:

1. `DESIGN.md` — the token file (open it, you'll paste it whole in Step 3).
2. `out/B04-24hrs-from-flight.png` — your style reference image.
3. This file — all seven screen prompts are in Step 5 onward.

A note on Stitch's interface: Google iterates on it often, so button labels
may have moved since this was written. The *sequence* holds even if a label
reads slightly differently — look for the function, not the exact word.

---

## Credit budget

Image input only runs in Experimental / Pro mode, which is capped at roughly
40–50 generations a month. Plan the spend:

| Phase | Generations |
|---|---|
| Seed the design system (Steps 2–3) | 2 |
| Screen A — Offer page 1, plus refinement | 4–5 |
| Screens B–G at ~2 each | 12 |
| **Total** | **~18–19** |

**If you're short on credits, build four screens, not seven.** Offer page 1,
Offer page 2, the zero-offer state, and review & pay. Those four carry the
entire argument: ranking, collapsing, genuine dynamism, and conversion. Skip
check-in start, the seat map and boarding passes — they're table stakes and
nobody questions them in a review.

---

## Step 1 — Create the project

1. Go to **stitch.withgoogle.com** and sign in.
2. Start a new project and choose **Mobile**, not Web.
3. Find the mode selector near the prompt bar and switch from **Standard /
   Fast** to **Experimental / Pro**.

**Check before continuing:** a `+` or paperclip icon should now be visible
next to the prompt bar. If it isn't, you're still in Fast mode and image
upload won't work.

---

## Step 2 — Seed the design system from the real screen

Click the `+` icon, attach **`out/B04-24hrs-from-flight.png`**, and paste:

> This is an existing mobile app screen from an airline's help hub. Extract its
> design system: colour tokens, typography scale, corner radii, spacing, button
> styles, card styles, and the distinct lavender "assistant" surface. Do not
> redesign it and do not improve it. Reproduce it faithfully as a reusable
> theme I can apply to new screens.

**What you should see:** a close copy of the Help Hub home — navy header,
white body, lavender assistant panels, outlined blue pill buttons.

**If it comes back dark-themed or restyled,** it ignored the reference. Reply
with one line: *"Too far from the reference. Match the uploaded screenshot
exactly: white page background, navy header block, lavender panels only for
assistant content."*

---

## Step 3 — Lock the tokens as explicit rules

Open `DESIGN.md`, copy the whole file, and paste it into the chat with this
line on top:

> Treat the following as fixed design rules for every screen in this project.
> Do not deviate from these tokens, components or rules unless I explicitly
> ask.

This matters more than it looks. Without it Stitch re-infers the style on
every generation and the screens drift apart by the third one.

---

## Step 4 — Set the running context

Paste this as plain context. It stops you having to restate the scenario in
every prompt:

> Context for all screens. The passenger is Marta Byrne, travelling with her
> partner Declan and two children, Fia (6) and Oisín (9). Flight: Dublin DUB
> to Faro FAO, Tuesday 14 October, FR1234, 06:35. Value fare, 7 nights, no
> seats or bags currently booked. She has bought Priority Boarding on three of
> her last four trips and has never bought travel insurance. All prices in
> euros. Four passengers on every booking reference.

---

## Build order is not journey order

These two sequences are deliberately different. Don't let it trip you up:

| Journey step (what the passenger sees) | Screen | Build this |
|---|---|---|
| 1 | Check-in start | 5th |
| 2 | **Offer page 1** | **1st** |
| 3 | Seat map | 6th |
| 4 | Offer page 2 | 2nd |
| 5 | Review and pay | 4th |
| 6 | Boarding passes | 7th |
| branch off step 1 | Zero-offer state | 3rd |

**Why build out of order:** build the component-richest screen first, then
descend. Offer page 1 establishes the assistant panel, the task card, the
status pill and the outlined decline button — the parts every other screen
reuses. Start with check-in start instead and you teach Stitch a thin
component set (header, flight card, passenger rows); when you later ask for
the assistant panel it has to invent it from scratch, and the two screens
drift apart.

Rule of thumb: each screen after the first should mostly *reuse* components
and rarely *invent* them.

One consequence to expect: screens appear on the Stitch canvas in creation
order, so the canvas won't read as the journey. That's fine — the linking in
Step 7 is what expresses the flow, not the canvas layout.

### The header ladder

The greeting is an *entry* pattern — in the Help Hub system it lives on the
home screen. Use it once, at the front door, and never again in the flow:

| Screen | Header |
|---|---|
| Check-in start | **Full greeting header** — harp logo, "Hi Marta,", subtitle, avatar, bell |
| Offer page 1 | Compact — back arrow, "Check in", step "1 of 2" |
| Seat map | Compact — back arrow, "Choose your seats" |
| Offer page 2 | Compact — back arrow, "Check in", step "2 of 2" |
| Review and pay | Compact — back arrow, "Review your extras" |
| Boarding passes | Compact — "Boarding passes" |
| Zero-offer state | **Full greeting header** — it is an entry screen too |

Greeting someone twice in two consecutive screens drains the word of meaning
and costs you vertical space on the screen that has to sell something. The
personalisation on the offer pages is carried by the assistant panel instead
— "You added it on your last 3 trips" does far more work than "Hi Marta,"
ever would.

Note the step indicator moves into the compact header, so the pale blue
"2 STEPS TO YOUR BOARDING PASSES" pill appears only on check-in start.

---

## The step-numbering rule

This is the single easiest way to destroy the whole argument. The promise is
"2 steps". If any screen says "4 of 4", the passenger has been lied to and
the reviewer stops believing the premise.

**Only the two offer pages carry a step number.** Nothing else does.

| Screen | Step indicator |
|---|---|
| Check-in start | "2 STEPS TO YOUR BOARDING PASSES" |
| Offer page 1 | "Step 1 of 2" |
| Seat map | **none** — it is a sub-screen of offer page 1, not a step |
| Offer page 2 | "Step 2 of 2" |
| Review and pay | **none** — checkout is not a step |
| Boarding passes | **none** |
| Zero-offer state | "1 STEP" |

The seat map is the one people get wrong. It is reached by tapping "Choose
seats" *on* offer page 1 and returns there. Numbering it makes seat selection
look like a mandatory stage and inflates the count the whole design exists to
reduce.

---

## The consistency contract

Every screen must state the same facts. Generative tools drift on detail —
they will invent an airline, change the route, or renumber the seats between
one screen and the next. Paste this into Stitch alongside `DESIGN.md`, and
check every generated screen against it.

> Fixed facts for every screen in this project. Never substitute, abbreviate
> or invent alternatives to any of these.
>
> - Airline: Ryanair. Never invent or use another airline name or code.
> - Flight: FR1234, Dublin DUB Terminal 1 to Faro FAO, Tuesday 14 October,
>   departs 06:35, boarding 05:55, gate 104, gate closes 06:05. This is the
>   outbound leg. Never reference the return.
> - Passengers: Marta Byrne (lead booker), Declan B, Fia B (child, 6), Oisín B
>   (child, 9). Booking reference X8Y9QL.
> - Seats: 12A, 12B, 12C, 12D in row 12. €6.00 per seat, €24.00 for four.
>   Seats are NOT free and NOT pre-allocated. Never use row 14.
> - Priority & 2 Cabin Bags: €76.00 for four passengers.
> - 20kg checked bag: €39.99, outbound only.
> - Total add-ons: €139.99. Payment: Visa ending 4412.
> - No countdown timers, no scarcity counters, no "X left" messaging anywhere.

That last line matters. Stitch will add urgency timers unprompted because
they're common in travel UI. They are a dark pattern, they contradict the
"decline is a first-class action" rule, and they will be the first thing a
design lead objects to.

---

## Step 5 — Build Offer page 1 first (journey step 2)

**Build this one before any other and get it right.** It contains every
component the rest of the flow reuses — the AI insight panel, the task card,
the status pill, the outlined decline button. Every later screen inherits from
it, so a flaw here propagates seven times.

> Mobile app screen, light theme, white background. A navy blue header block
> with rounded bottom corners containing a small yellow harp logo, the heading
> "Hi Marta," in large bold white, the subtitle "Let's get you ready to fly",
> a circular avatar with a yellow ring, and a bell icon.
>
> Below the header, on white: a pale blue uppercase pill label reading
> "2 STEPS TO YOUR BOARDING PASSES". Then a white card with a thin grey border
> showing a plane icon, "Dublin → Faro" in bold, "Tue 14 Oct · FR1234 · 06:35"
> in grey, and a yellow badge reading "Check-in open".
>
> Then a light lavender rounded panel with an indigo circular sparkle avatar
> and an indigo bold heading "You usually travel with Priority". Supporting
> grey sentence: "You added it on your last 3 trips." Inside the panel, two
> white cards. First card: bag icon, title "Priority & 2 Cabin Bags", an indigo
> status pill reading "Your usual", description "Skip the queue, 2 bags each",
> price "€76 for 4 passengers" in bold, and an outlined blue pill button "Add".
> Second card: seat icon, title "Sit together", an amber status pill reading
> "Recommended", description "Seats are assigned free, but your family may be
> split up", price "€24 for 4 seats", outlined blue pill button "Choose seats".
>
> Below the panel, a full-width outlined blue pill button "No thanks, continue
> →". A four-icon bottom tab bar.

### Refining it — one change per prompt

This is the rule that most affects output quality. Combining several layout
edits into one prompt degrades the result noticeably. Fix in this order, one
message each:

1. *"Make the lavender assistant panel wider so it spans the full content
   width, with the two white cards nested inside it with 12px padding."*
2. *"Increase the price text to 18px bold and move it to the left of the Add
   button on the same row."*
3. *"Make the 'No thanks, continue' button the same width and height as the
   Add buttons. It must not look disabled or secondary."*

**Do not move on until Screen A is right.**

---

## Step 6 — Generate the remaining screens

For each one, open a new screen in the project and start the prompt with the
same inheritance line:

> Same design system, components and style as the previous screen.

Then paste the body below.

### Screen B — Offer page 2

> Pale blue uppercase label "STEP 2 OF 2". Section heading "Anything in the
> hold?" in bold near-black.
>
> A light lavender panel with indigo sparkle avatar and indigo heading "Most
> families on this route add a bag". Grey supporting line "7 nights, 4
> travellers." Inside it one white card: suitcase icon, "20kg Checked Bag",
> "€39.99", a quantity stepper set to 0, and an outlined blue pill button "Add".
>
> Below, a collapsed white row with a thin grey border reading "More extras
> (1)" with a chevron on the right, visibly lower emphasis than the card above.
>
> Then a full-width outlined blue pill button "No thanks, continue →".

### Screen C — Zero-offer state

The most important screen in the set. It is the proof the system is genuinely
dynamic rather than a reskinned fixed funnel.

> Pale blue uppercase label "1 STEP". A white card with a plane icon showing
> the Dublin to Faro flight, "Tue 14 Oct · FR1234 · 06:35" in grey. A light
> lavender panel with indigo sparkle avatar, indigo heading "You're all set"
> and the grey line "Nothing else to add for this trip." A full-width solid
> navy pill button "Get boarding passes". No offer cards anywhere on the
> screen.

### Screen D — Review and pay

> Navy header reading "Review your extras". A white card with three line
> items, each with a leading icon, a title, a price on the right and a small
> grey remove link: "Priority & 2 Cabin Bags ×4 €76.00", "Seats 12A–12D
> €24.00", "Checked bag 20kg €39.99". Below the card a row with "Total" and
> "€139.99" in large bold. A white card showing a saved Visa ending 4412. A
> full-width solid navy pill button "Pay and get boarding passes".

### Screen E — Check-in start

This is the journey's front door, so it carries the full greeting header —
the only screen in the flow that does.

> A full navy blue header block with rounded bottom corners: a small yellow
> harp logo top left, a circular avatar with a yellow ring and a bell icon top
> right. The heading "Hi Marta," in large bold white, and the subtitle "Let's
> get you checked in" in lighter white below it.
>
> On the white body: a white card with a thin grey border showing a plane
> icon, "Dublin → Faro" in bold, "Tue 14 Oct · FR1234 · 06:35" in grey, and a
> yellow badge "Check-in open".
>
> Then a pale blue uppercase label "4 PASSENGERS" and four rows, each with a
> circular initials avatar and a name: "Marta B", "Declan B", "Fia B · Child",
> "Oisín B · Child".
>
> Then a pale blue uppercase pill reading "2 STEPS TO YOUR BOARDING PASSES".
> A full-width solid navy pill button "Start check-in". A four-icon bottom
> tab bar.

### Build 6 — Seat map (journey step 3)

> Navy header reading "Choose your seats". A Boeing 737 seat map on white,
> rows numbered down the left. Four adjacent seats in row 12 highlighted in
> brand yellow with a small label "Best row for your group". Several rows
> greyed out as unavailable. A light lavender panel below the map with indigo
> sparkle avatar and indigo heading "I've found 4 seats together", grey line
> "Row 12, near the front." A sticky bottom bar showing "4 seats · €24.00" on
> the left and a solid navy pill button "Confirm seats" on the right.

### Screen G — Boarding passes

> Navy header reading "Boarding passes". A swipeable stack of four boarding
> pass cards, the front one for "Marta Byrne", seat 12A, with a QR code, the
> route "DUB → FAO" and "FR1234 · 06:35". Two small badges on the pass reading
> "PRIORITY" and "12A". A dot indicator showing 1 of 4. A full-width outlined
> blue pill button "Add all to Apple Wallet". A small grey text link at the
> bottom "Changed your mind? Manage extras".

---

## Step 7 — Connect the flow

Use Stitch's screen-linking to wire the journey:

```
Check-in start
  └→ Offer page 1
       ├─ "Choose seats" ─→ Seat map ─→ Offer page 2
       └─ "No thanks"    ─────────────→ Offer page 2
                                          └→ Review and pay ─→ Boarding passes

Zero-offer state ── branch off Check-in start, when nothing is eligible
```

Keep C off the main chain. It's the alternate path, and showing it as a branch
rather than a step is what makes the dynamic behaviour legible in a review.

---

## Step 8 — Export

**To Figma:** use "Copy to Figma" with the Stitch Figma plugin. You get
editable frames with Auto Layout, so the team can merge it into the App 2026
library rather than rebuilding.

**To code:** export as a zip, or pull it into AI Studio via the MCP
integration if you want a clickable prototype.

---

## If it goes wrong

| Symptom | Fix |
|---|---|
| Screens drift apart in style | You skipped Step 3, or stopped using the "Same design system as the previous screen" opener. Re-paste `DESIGN.md`. |
| Lavender appears on ordinary cards | *"Lavender is only for assistant content. Make all non-assistant cards white with a 1px grey border."* |
| Decline button renders greyed or tiny | *"The decline button must be full width with the same visual weight as the primary action. It is not a secondary action."* |
| Offers come back pre-selected | *"Nothing is pre-selected. All toggles start off and all steppers start at 0."* |
| Output goes dark-themed | It lost the reference. Re-upload `B04` and repeat Step 2. |
| Layout breaks after a big edit | You asked for several changes at once. Undo, then make them one at a time. |

---

## Two things to flag when you present this

Say both up front — they're the questions a design lead will ask in the first
two minutes:

1. The lavender assistant surface is lifted from the Help Hub explorations
   dated 10/2026. Those are explorations, not a shipped spec, so it needs
   confirming with Product Design & Delivery as an approved token.
2. The assistant is unnamed here. The Help Hub boards show a sparkle avatar
   with first-person copy but no product name, so these screens follow the
   same convention. If there's a name coming, the copy changes.
