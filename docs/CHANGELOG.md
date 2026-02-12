# Changelog

## 2026-02-12 — Harden reliability, auth, checkout, persistence, and accessibility (`a0b728b`)

### Frontend reliability

- Added request timeout/abort handling and stronger non-OK error parsing in:
  - `contexts/ProductContext.tsx`
  - `contexts/VetContext.tsx`
  - `contexts/ArticleContext.tsx`

### Auth and session hardening

- Strengthened token/session validation and expiration handling in `contexts/AuthContext.tsx`.
- Added safer protected API request handling and improved response guards.

### Cart and checkout integrity

- Added quantity clamping and persisted cart sanitization in `contexts/CartContext.tsx`.
- Updated checkout validation and server-aligned reconciliation in `pages/CheckoutPage.tsx`.
- Expanded cart regression coverage in `__tests__/contexts/CartContext.test.tsx`.

### Backend validation and persistence

- Hardened JSON DB write path and rollback behavior in `backend/src/db.ts`.
- Added stricter auth/ownership checks and persistence updates in `backend/src/routes/authRoutes.ts`.
- Added stronger server-side order validation (items/stock/price/totals) in `backend/src/routes/orderRoutes.ts`.

### Accessibility and UX consistency

- Standardized modal/dialog keyboard and focus behavior across existing UI components:
  - `components/ConfirmationModal.tsx`
  - `components/ProductQuickViewModal.tsx`
  - `components/VetBookingModal.tsx`
  - `components/CookiePolicyModal.tsx`
  - `components/AdoptionForm.tsx`
  - `components/VaccinationReminder.tsx`
  - `components/PostCard.tsx`
- Improved button semantics and ARIA consistency in `components/Header.tsx`, `components/CartSidebar.tsx`, and `components/CookieConsentBanner.tsx`.

### Performance

- Lazy-loaded non-critical widgets in `App.tsx` (WhatsApp and Messenger integrations).
