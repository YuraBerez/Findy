# Feature Spec: Error handling

- **ID:** 003-error-handling
- **Status:** Approved
- **Created:** 2026-11-17
- **Approved:** 2026-11-17 (owner request)
- **Builds on:** [001-mvp-board](../001-mvp-board/spec.md)

## Summary

When an action fails today, nothing tells the user: a failed save looks like a
click that did nothing. Every failure must be visible, understandable and safe:
the user sees what happened, nothing they typed is lost, and the board shows the
real saved data.

## User stories

### US-1 — See that an action failed (P1)

As a user, I want a clear message when something I did was not saved.

**Acceptance scenarios**

1. **Given** an action fails, **Then** a notification explains it in my language
   and says whether my data changed.
2. **Given** a notification, **When** I close it or wait, **Then** it goes away.
   Hovering or focusing it keeps it open.
3. **Given** the application was already deleted elsewhere, **When** I act on it,
   **Then** the notification says it no longer exists and the board shows the saved state.

### US-2 — Keep my input when saving fails (P1)

**Acceptance scenarios**

1. **Given** the New application dialog, **When** saving fails, **Then** the dialog
   stays open with my input.

### US-3 — Recover from a crash of the interface (P1)

**Acceptance scenarios**

1. **Given** the interface fails to render, **Then** I see an explanation and a
   "Reload" button instead of an empty window; my data is safe.

## Functional requirements

- **FR-001** Every IPC call from the renderer MUST go through one handler that
  shows a notification on failure. No call may fail silently.
- **FR-002** Messages MUST depend on the error code: VALIDATION, NOT_FOUND,
  STORAGE, and a generic message for anything else. Both languages.
- **FR-003** After NOT_FOUND or an unknown failure, the renderer MUST reload the
  state from main, so the board shows the saved data.
- **FR-004** Actions MUST report success, so dialogs close only after a save.
- **FR-005** Unhandled errors and promise rejections in the renderer MUST show the
  generic notification.
- **FR-006** A render error MUST show a fallback screen with "Reload".
- **FR-007** Notifications MUST be announced to screen readers (`role="alert"`),
  have a close button, close after 8 s, and stay while hovered or focused.

## Out of scope

- Logging to a file or remote error reporting (constitution §II: no telemetry).
- Retrying failed calls automatically.

## Decisions

- **D-1** Notifications appear bottom-right, newest on top, at most 3 at a time.
