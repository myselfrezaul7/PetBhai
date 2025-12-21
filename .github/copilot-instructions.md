# PetBhai - AI Coding Agent Instructions

## Project Overview

**PetBhai** is a React-based pet care platform (pets, vets, adoption, shop, community, AI assistant) built with TypeScript, Vite, and deployed to GitHub Pages. It uses React Context for state management and localStorage for persistence. The app supports AI features via Gemini API (client-side or serverless proxy).

## Architecture & Key Patterns

### 1. **Context-Based State Management**

- **Location**: `contexts/` directory (8 core contexts)
- **Pattern**: Use React Context + `useReducer` for complex state (Cart, Auth)
- **Common contexts**:
  - `AuthContext`: User login/registration, wishlist, order history, Plus membership (uses localStorage for persistence)
  - `CartContext`: Reducer-based with localStorage sync; filters items on quantity = 0
  - `ThemeContext`: Dark/light mode toggle
  - `ToastContext`, `ConfirmationContext`: Global UI state (messages, modals)
  - `ArticleContext`, `ProductContext`: Mock data providers
  - `LanguageContext`: i18n support (structure present but not fully implemented)

**Adding new context**: Create in `contexts/`, wrap in App.tsx Suspense providers, use `useContext` hook pattern.

### 2. **Component Structure**

- **Reusable components**: `components/` (e.g., `AnimalCard`, `ProductCard`, `VetCard`, `ServiceCard`)
- **Page components**: `pages/` (lazy-loaded in App.tsx routes)
- **Lazy loading**: All pages use `React.lazy()` + `<Suspense>` with `PawHeartLoader` skeleton
- **Icons**: Custom React components in `components/icons.tsx` (PawIcon, ShoppingCartIcon, etc.)

**Pattern**: Functional components with hooks, pass data via props, use context for global state.

### 3. **Routing**

- **Router**: HashRouter (github pages compatible)
- **Routes**: Defined in [App.tsx](App.tsx#L70-L150) with lazy-loaded pages
- **Key routes**: `/`, `/shop`, `/blog`, `/adopt`, `/vet-services`, `/community`, `/profile`, `/checkout`

### 4. **AI Integration** (`geminiService.ts`)

- **Client approach**: Direct Gemini API (requires `GEMINI_API_KEY` in `.env.local`)
- **Production approach**: Serverless proxy at `serverless/ai-proxy/index.js` (handles API key server-side)
- **Detection**: `isAiConfigured()` checks for valid key; treats placeholders as not configured
- **Fetch wrapper**: Custom `fetchWithTimeout()` (12s timeout) to prevent hanging requests
- **Singleton pattern**: Single `aiInstance` reused across calls

**For AI features**: Use `geminiService.ts` directly; for production, set `VITE_AI_PROXY_URL` and proxy forwards JSON `{ prompt }`.

### 5. **Data Persistence**

- **localStorage keys**: Prefixed with `petbhai_` (e.g., `petbhai_cart_items`, `petbhai_users`, `petbhai_currentUser`)
- **Pattern**: JSON parse/stringify with error recovery (clears corrupted data)
- **Mock data**: `constants.ts` exports `MOCK_PRODUCTS`, `MOCK_USERS`, etc. used as initialization

**When adding persistence**: Follow the pattern in CartContext or AuthContext; always wrap in try-catch.

### 6. **Type System**

- **Location**: `types.ts` (single file, ~200 lines)
- **Pattern**: Named interfaces for all domain objects (Product, User, Animal, Article, etc.)
- **Union types**: `AnimalStatus`, `AnimalAge`, `AnimalGender`, `AnimalSize` for enums
- **Relation types**: CartItem, Order, Review (exported from types.ts)

**When adding features**: Define types in `types.ts` first, then implement components/services.

## Build & Deployment

### Local Development

```bash
npm install
# Set GEMINI_API_KEY in .env.local (optional for dev)
npm run dev  # Runs on http://localhost:3000
```

### Commands

- **Lint**: `npm run lint` (no warnings allowed)
- **Type check**: `npm run typecheck`
- **Format**: `npm run format` (prettier)
- **Build**: `npm run build` (Vite)
- **CI**: `npm run ci` (lint + typecheck + build + html validation)
- **HTML validation**: `npm run check:html` (enforced in CI)
- **Deploy**: `npm run deploy` (gh-pages to petbhai.com via CNAME)

### Configuration

- **Vite config**: `vite.config.ts` - port 3000, alias `@/` to root, Gemini API key injection
- **TypeScript**: `tsconfig.json` - strict mode, ES2022 target, bundler resolution
- **ESLint**: `eslint.config.cjs` - max 0 warnings enforced
- **Prettier**: Built-in formatting for `.ts,.tsx,.js,.jsx,.json,.md,.css,.html`

### Secrets & Environment

- `GEMINI_API_KEY`: For server-side AI proxy (GitHub Actions secret)
- `VITE_AI_PROXY_URL`: Optional; if set, frontend POSTs to this proxy instead of calling Gemini directly
- CI includes gitleaks secret scan on `dist/` and repo; smoke-test for AI proxy if secrets configured

## Project Conventions

### Naming & File Structure

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Utilities/Services**: camelCase (e.g., `geminiService.ts`)
- **Context files**: PascalCase with `Context` suffix (e.g., `CartContext.tsx`)
- **Pages**: PascalCase with `Page` suffix (e.g., `ProductDetailPage.tsx`)

### CSS & Styling

- **Framework**: Tailwind CSS (implicit from file inspection)
- **Pattern**: Inline Tailwind classes in JSX (e.g., `className="flex items-center"`)
- **Dark mode**: Managed by ThemeContext (class toggling)

### Testing

- **Status**: No test files present (new feature opportunity)
- **Recommendation**: Add Jest + React Testing Library when needed

### Error Handling

- **Pattern**: Try-catch for localStorage operations (AuthContext, CartContext); console.error logging
- **UI feedback**: ToastContext for user-facing errors
- **Async**: Use ConfirmationContext for critical actions before execution

## Common Tasks

### Adding a New Page

1. Create component in `pages/` (e.g., `MyNewPage.tsx`)
2. Add lazy import + route in [App.tsx](App.tsx#L25-L45)
3. Add navigation link in [Header.tsx](components/Header.tsx) if needed
4. Use existing contexts for state (no new context unless global data sharing needed)

### Adding a New Context

1. Create `contexts/MyNewContext.tsx` with provider component
2. Wrap provider in [App.tsx](App.tsx#L75-L90) around `<Suspense>`
3. Export hook (`useMyContext`) for consumption
4. Use in components via `const { data } = useMyContext()`

### Integrating with AI

- Use `geminiService.ts` functions (e.g., `generateText()`, `analyzeImage()` if present)
- Check `isAiConfigured()` before rendering AI UI
- For long responses, use pagination or streaming if available

### Adding Product/Article Data

- Mock data stored in `constants.ts`
- For real data: implement backend fetching and replace mock imports
- Keep data structure matching `types.ts` interfaces

## Debugging Tips

- **Vite config**: Check `import.meta.env.VITE_*` for Vite-specific env vars
- **localStorage**: Open browser DevTools → Application → Local Storage to inspect
- **Context state**: Use React DevTools → Components tab to inspect context values
- **Routing**: HashRouter URLs use `#/path` (GitHub Pages requirement)
- **Build issues**: Run `npm run ci` locally before pushing; CI enforces linting + HTML validation

## File References

- **Main entry**: [App.tsx](App.tsx) - routes, context providers, layout
- **Type definitions**: [types.ts](types.ts) - domain models
- **Constants**: [constants.ts](constants.ts) - mock data
- **AI service**: [services/geminiService.ts](services/geminiService.ts) - Gemini integration
- **Build config**: [vite.config.ts](vite.config.ts)
- **CI config**: `.github/workflows/` (if present)

---

_Last updated: December 2025_
