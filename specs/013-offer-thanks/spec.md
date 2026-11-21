# Feature Spec: Congratulate on an offer and ask for support

- **ID:** 013-offer-thanks
- **Status:** Implemented (0.5.0)
- **Approved:** 2026-11-20 (owner)
- **Author(s):** owner
- **Created:** 2026-11-20
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md) (stages, About, "Found an issue?")

## Summary

Findy is free and has no income. The best moment to ask for support is when Findy
helped: the user just got an offer. When the user moves an application to Offer for the
first time, Findy congratulates them and asks if it helped with the job search. If yes,
it asks for a donation to the project and a star on GitHub. If not, it asks what to
improve. The answer stays on the computer: Findy sends nothing anywhere. The user can
also support the project at any time from the menu and the About dialog.

## User stories

### US-1 — Congratulations and a question after the first offer (P1)

As a user who got an offer, I want Findy to congratulate me and ask once if it
helped, without getting in my way.

**Acceptance scenarios**

1. **Given** the user never answered the question, **When** the user moves an
   application to Offer in the app (drag and drop, keyboard, card menu or details
   panel), **Then** after the move a dialog congratulates the user and asks "Did Findy
   help with your job search?" with the answers **Yes** and **Not really**, and a smaller
   **Don't ask again** (D-7: no **Not now**).
2. **When** the user selects **Yes**, **Then** the dialog thanks the user and shows two
   actions: **Support on Ko-fi** and **Star on GitHub**. Each opens its page in the
   system browser.
3. **When** the user selects **Not really**, **Then** the dialog asks what to improve
   and shows **Tell us what to improve**, which opens the same feedback page as
   "Found an issue?".
4. **When** the user closes the dialog (Esc, the close button, a click outside),
   **Then** the dialog closes and is shown again after the next move to Offer.
5. **Given** the user answered **Yes** or **Not really**, or selected **Don't ask
   again**, **Then** the dialog is never shown again.
6. **Given** the dialog was shown, **Then** the move to Offer is already saved; the
   dialog never undoes or blocks it.

### US-2 — Support Findy at any time (P2)

As a user, I want to find how to support Findy without waiting for an offer.

**Acceptance scenarios**

1. **Given** the board, **When** the user opens the **⋯** menu, **Then** it has
   **Support Findy…**, which opens the Ko-fi page in the system browser.
2. **Given** the app's native Help menu, **Then** it has **Support Findy…**, which opens
   the same page. (About is the system's own panel and cannot hold a link: plan D-2.)

### US-3 — Confetti for every offer (P2)

As a user who got an offer, I want a short celebration, so that the moment feels good.

**Acceptance scenarios**

1. **Given** any move of an application to Offer in the app (FR-001, FR-002), **Then**
   confetti falls over the window for a few seconds, also when the question was
   answered before.
2. **Given** the confetti, **Then** the user can keep working: it does not block a
   click, a key or a screen reader, and the offer dialog (if any) shows at the same time.
3. **Given** the system setting to reduce motion, **Then** there is no confetti.

## Functional requirements

- **FR-001** The app MUST show the offer dialog after a move of an application to
  Offer that the user made in the app, and only while the user has not given a final
  answer (FR-004).
- **FR-002** The app MUST NOT show the dialog for a move to Offer from a CSV import,
  from an AI assistant (MCP), or when the application was created in Offer. A move from
  Offer to Offer again (a reorder in the column) does not count.
- **FR-003** The dialog MUST offer the answers **Yes**, **Not really** and **Don't ask
  again**, and a close button (D-7). **Yes** shows the support step (Ko-fi and GitHub star); **Not
  really** shows the feedback step.
- **FR-004** **Yes**, **Not really** and **Don't ask again** are final answers: the app
  MUST remember on this computer that the question was answered and MUST NOT show the
  dialog again. Closing the dialog is not final.
- **FR-005** The answer MUST stay on the user's computer. The app MUST NOT send it, or
  any other data, anywhere. Opening a page in the browser sends nothing from Findy.
- **FR-006** All links (Ko-fi, the GitHub repository, the feedback page) MUST open in
  the system browser and come from the project's single list of addresses.
- **FR-007** The ⋯ menu and the native Help menu MUST have **Support Findy…**, which
  opens the Ko-fi page.
- **FR-008** All texts MUST be in English and Ukrainian.
- **FR-009** The dialog MUST be keyboard accessible: focus moves into it when it opens,
  Esc closes it without an answer, and focus returns to the moved card when it closes.
- **FR-010** Each move to Offer that FR-001 and FR-002 count MUST play confetti for at
  most 3 seconds, whatever the answer to the question is (US-3).
- **FR-011** The confetti MUST NOT take clicks, keys or focus and MUST be hidden from
  assistive technology.
- **FR-012** With the system setting to reduce motion, the app MUST NOT play the
  confetti.

## Non-functional requirements

- **NFR-001** The dialog appears within 300 ms after the move and never covers the
  result of the move with an error.
- **NFR-002** The remembered answer survives app updates and restarts; it is not part
  of a CSV export.

## Edge cases

- Several applications reach Offer one after another while the dialog is open → only
  one dialog is shown.
- The user moves an application to Offer and back at once → the dialog is still shown
  (the move happened); the user can close the dialog.
- Offline → the dialog works; the browser shows its own page if there is no network.
- The move is made in the details panel → the dialog opens when the panel closes.
- The Offer column is hidden → a move to it from the card menu or details panel still
  counts.

## Out of scope

- Payments inside the app, other donation platforms, recurring reminders, banners.
- Any statistics about answers or donations.
- In-app rating stores (Mac App Store, Microsoft Store).

## Success criteria

- **SC-001** A user who gets an offer sees the question once and reaches the Ko-fi
  page in two clicks.
- **SC-002** A user who never gets an offer never sees a request for money, except the
  menu items.

## Decisions

- **D-1** Show on the first offer; **Not now** asks again on the next offer; a final
  answer or **Don't ask again** ends it (owner, 2026-11-20). Changed by D-7: closing the
  dialog takes the place of **Not now**.
- **D-2** First a question; **Yes** → Ko-fi and a GitHub star, **Not really** → the
  feedback page (owner, 2026-11-20).
- **D-3** Only moves the user makes in the app count; not CSV import or MCP
  (owner, 2026-11-20).
- **D-4** A permanent **Support Findy…** item in the ⋯ menu and a link in About
  (owner, 2026-11-20). Changed in planning: the link is in the native Help menu, because
  About cannot hold a link (plan D-2).
- **D-5** No constitution change: the answer stays local (§II.1–2), and the pages open
  in the system browser (§III.4).
- **D-6** Confetti on every move to Offer in the app, not only with the question;
  none when the system reduces motion (owner, 2026-11-20).
- **D-7** No **Not now** button: three answers next to **Don't ask again** were too
  many. The close button, Esc and a click outside still close the dialog without an
  answer, and it asks again on the next offer (owner, 2026-11-21, after release 0.5.0).

## Open questions

None.
