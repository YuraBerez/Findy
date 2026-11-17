# Tasks: Error handling

- **Spec:** [spec.md](spec.md)

- [x] T001 `ui/Toast` + `ToastViewport` (FR-007)
- [x] T002 `app/notifications`: provider, `notify`, message by error code (FR-002)
- [x] T003 `useAppState.run()`: every IPC call; refresh on NOT_FOUND/unknown; actions return success (FR-001, FR-003, FR-004)
- [x] T004 Global `error` / `unhandledrejection` listeners (FR-005); `ErrorBoundary` with Reload (FR-006)
- [x] T005 Callers: dialogs close only on success (US-2)
- [x] T006 en/uk strings; docs/architecture.md note
- [x] T007 Tests: unit for message mapping; e2e for US-1.1–1.3, US-2, unhandled rejection; a11y of a toast. The ErrorBoundary fallback (FR-006) has no e2e yet: there is no safe way to make React fail from a test
