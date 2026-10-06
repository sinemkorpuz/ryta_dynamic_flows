# Flow map — linking the seven screens

Your canvas is currently in **build order** (E, A, F, B, D, C, G). That was
right for building. It's wrong for reviewing. Here is the journey order and
the link-by-link wiring.

---

## Journey order

```
1. Screen E   Check-in start            "2 STEPS TO YOUR BOARDING PASSES"
2. Screen A   Offer page 1              "Step 1 of 2"
   └ Screen F Seat map                  (no step number — sub-screen of A)
3. Screen B   Offer page 2              "Step 2 of 2"
4. Screen D   Review and pay            (no step number)
5. Screen G   Boarding passes           (no step number)

   Screen C   Zero-offer state          "1 STEP"  — branch off Screen E
```

Five screens on the main path. The seat map is a detour off page 1, and the
zero-offer state is an alternate first destination.

---

## Link wiring

| On screen | Tap this element | Goes to |
|---|---|---|
| **E** Check-in start | `Start check-in` | **A** Offer page 1 |
| **A** Offer page 1 | `Choose seats` (Sit together card) | **F** Seat map |
| **A** Offer page 1 | `Add` (Priority card) | **B** Offer page 2 |
| **A** Offer page 1 | `No thanks, continue →` | **B** Offer page 2 |
| **A** Offer page 1 | back arrow | **E** Check-in start |
| **F** Seat map | `Confirm seats` | **B** Offer page 2 |
| **F** Seat map | back arrow | **A** Offer page 1 |
| **B** Offer page 2 | `Add` (20kg bag card) | **D** Review and pay |
| **B** Offer page 2 | `No thanks, continue →` | **D** Review and pay |
| **B** Offer page 2 | back arrow | **A** Offer page 1 |
| **B** Offer page 2 | `More extras (1)` | expands in place — no link |
| **D** Review and pay | `Pay and get boarding passes` | **G** Boarding passes |
| **D** Review and pay | back arrow | **B** Offer page 2 |
| **G** Boarding passes | `Manage extras` | **D** Review and pay |
| **C** Zero-offer | `Get boarding passes` | **G** Boarding passes |

---

## Two wiring traps

**1. `Confirm seats` on the seat map must go to Offer page 2, not back to
Offer page 1.** If it returns to page 1 the passenger sees the same offer
screen twice and the "2 steps" promise visibly breaks. The seat map is a
detour that rejoins the flow further along, not a round trip.

**2. The back arrow on Offer page 2 goes to Offer page 1, not to the seat
map.** Someone who declined seats never saw the map; sending them backwards
into it is disorienting and makes a skipped page reappear.

---

## Handling the branch

Screen E's `Start check-in` button has two possible destinations depending on
what the model scored — Offer page 1 when there are eligible ancillaries,
Zero-offer when there are none. A prototype only allows one link per element,
so:

- Wire `Start check-in` → **A** as the primary path.
- Place **C** directly below **E** on the canvas, with a text label between
  them reading *"Same tap — when no ancillaries are eligible"*.
- In the walkthrough, jump to C manually when you reach that point.

Don't try to hide the ambiguity. The fact that one button leads to two very
different experiences *is* the product, and showing it as a visible fork is
more persuasive than any amount of narration.

---

## Canvas arrangement

Rearrange the frames left to right in journey order:

```
E  →  A  →  F  →  B  →  D  →  G
      │
C ────┘  (positioned below E)
```

Currently they sit in build order, so the canvas reads as a different story
to the one the links tell. Dragging frames costs no generations and makes the
review far easier to run — people read the canvas before they read anything
you say.

---

## How to wire it in Stitch

**Do the canvas rearrange first.** Stitch's Instant Prototype feature
auto-detects flows partly from button labels *and spatial order*. Your frames
are in build order, so letting it guess now would wire the journey wrongly.
Drag them into journey order before you link anything:

```
E  →  A  →  F  →  B  →  D  →  G
      │
C ────┘  (below E)
```

**Then link each element:**

1. With the arrow/select tool, click the element on the canvas — for example
   the `Start check-in` button on Screen E.
2. A direct-edit menu appears with four options:
   - *Imagine a new screen after clicking this component*
   - **Connect to an existing screen** ← use this one
   - *Change with AI*
   - *Edit text*
3. Choose **Connect to an existing screen** and pick the target frame.
4. Repeat for each row of the wiring table above.

Start with the seven forward links. Add the back arrows afterwards — they
matter less in a walkthrough and you may decide not to bother.

**Test it:** select a frame and hit **Play** in the top toolbar to enter
Instant Prototype mode, then tap through. Start from Screen E and walk the
whole path to Boarding passes.

---

## Where the prototype lives — decide now

Interaction wires **do not survive export to Figma**. Stitch exports frames,
auto-layouts, text and styling as editable layers, but the links become dead
and have to be re-wired manually as Figma prototype transitions.

So pick one:

- **Run the review from Stitch Play mode** — link once, present from Stitch.
  Fastest, and the links you build here are the ones you use.
- **Hand off to Figma** — export the frames and re-wire there. Budget the
  extra pass. Worth it if the Ryanair design team needs to own and extend it.

One export caveat: if your model dropdown is set to Gemini 3 Pro, native
"Copy to Figma" is disabled. You'd download the code as a `.zip` and bring it
into Figma via a plugin like `html.to.design` instead. If you plan to hand off
to Figma, check that dropdown before you export.

---

## Still outstanding

Four small things from the repair pass that haven't landed yet:

1. **Seat map** — the countdown survived. It moved into the lavender panel
   and now reads *"Seats held for 09:42 • No extra grouping fee"*.
   > Remove the "Seats held for 09:42" countdown from the lavender panel.
   > Keep the rest of the sentence. There are no timers anywhere in this flow.

2. **Zero-offer** — still shows `Seat 14A` on the flight card.
   > Remove the "Seat 14A" line from the flight card. In this version the
   > passenger bought no extras, so no seat has been reserved.

3. **Offer page 2** — still says *"for your return journey"*, and the garbled
   refund line is still there.
   > Change "Customise your checked luggage allowance for your return journey"
   > to "Customise your checked luggage allowance for this flight". Remove the
   > line reading "Guaranteed cabin companion or gate bag refund guarantee".

4. **Check-in start** — the children's ages are wrong.
   > Correct the passenger ages so Fia B is 6 and Oisín B is 9.

Optional, your call: check-in start still carries the *"Ask or search for help
with this trip"* search bar. It's faithful to the Help Hub home, but an
open-ended search field at the top of a task flow is an invitation to leave
the task. Removing it is one more prompt if you want the flow tighter.
