# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- Created `architecture.md` documenting the full app architecture, flow, and logic for Icebreaker App.
- Updated PLANNING.md to reference finalized architecture and next steps.

## [1.0.0] Stable Restore Point — 2025-05-09T13:50:01-04:00
### Fixed
- Fixed frontend sessionId passing: Home now passes sessionId as a prop to TeamSubmit, preventing undefined errors.
- Fixed backend voting bug: Correctly instantiate ObjectId with `new` in /api/vote route, resolving TypeError.
- Fixed Home.js syntax error: Added missing parenthesis and bracket for valid JSX.

### Confirmed
- All core flows (session creation, submission, voting) now work without errors.
- Backend and frontend are stable; this is a safe milestone for future rollbacks.

---

## [1.1.0] First UI Iteration — 2025-05-09T14:23:47-04:00
### Added
- Admin page now includes a form to create new sessions directly from the UI.
- Consistent MongoDB-themed UI across all pages (Home, SessionCreate, TeamSubmit, Results).
- Custom logo support: all pages reference `/logo.png` with prominent display and improved sizing.

### Changed
- Major UI overhaul for modern, clean, and consistent look.
- Improved alignment, spacing, and visual hierarchy for all forms and cards.
- Removed navigation links from the admin session page for a focused experience.

### Fixed
- Syntax and lint errors in session and voting logic.
- Duplicate and stray code blocks removed from admin handlers.
- Bug fixes for session creation and state updates.

---

## [Unreleased]
### Planned
- Further improve accessibility and responsive design.
- Add timer and real-time state updates for sessions.
- Enhance admin controls and error feedback.

---

*This changelog was started on 2025-05-09. Please update with each significant change.*
