# CrMS — Copilot Instructions

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite, Ant Design, SCSS Modules
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, Redis (BullMQ)
- **Auth**: Passport.js (OAuth2 for YouTube, Instagram, etc.)
- **AI**: OpenAI SDK for agent workflows

## Project Structure

```
server/
  src/
    agents/         # AI agent implementations
    config/         # DB, Redis, OpenAI, env, logger
    controllers/    # Express route handlers
    jobs/           # BullMQ background jobs
    middleware/     # Auth guards, rate limiting
    prisma/         # Schema + migrations
    routes/         # Express router definitions
    services/       # Business logic
    types/          # Shared TypeScript types
    utils/          # Shared utilities (crypto, helpers)

ui/
  src/
    components/     # Global reusable components
    constants/      # Global constants
    hooks/          # Global custom hooks
    pages/          # Feature pages (each a self-contained module)
    store/          # Redux Toolkit + RTK Query
    styles/         # Global SCSS (abstracts, base, layout)
    types/          # Global TypeScript types
    utils/          # Global utility functions
```

### Page Module Structure

Each page folder under `ui/src/pages/<feature>/` should follow:

```
pages/<feature>/
  index.ts          # Barrel re-exports (public API)
  constants.ts      # Feature-specific constants
  components/       # Feature-specific sub-components
  pages/            # Actual page-level components
  styles/           # SCSS modules (*.module.scss)
  hooks/            # Feature-specific hooks (if needed)
  helpers/          # Feature-specific pure functions (if needed)
  types/            # Feature-specific types (if needed)
```

## Styling Rules

### Use SCSS Modules — never inline styles

- Every component with visual styling must have a co-located `*.module.scss` file.
- Import as `import s from './styles/MyComponent.module.scss';` and use `className={s.class_name}`.
- **Never use inline `style={{}}` props** for layout or spacing. Use SCSS classes.
- Use Ant Design components for interactive widgets (Button, Table, Tag, etc.) but use SCSS for layout and spacing.

### SCSS Class Naming (BEM with underscores)

- Use **underscores** in class names, never hyphens: `.info_bar`, `.content_card`.
- BEM convention: `.block__element`, `.block--modifier`.
- Modifiers in TSX use bracket notation: `s['card--active']`.
- Vite does NOT convert hyphens to underscores — `&__some-class` in SCSS will NOT match `s.some_class` in TSX.

### Design Tokens

- Always import design tokens: `@use '../../../styles/abstracts' as *;`
- Use variables for colors (`$color-primary-500`), spacing (`$space-4`), radii (`$radius-md`), shadows (`$shadow-md`), typography (`$font-size-sm`), and breakpoints (`$bp-lg`).
- Use mixins: `@include card()`, `@include flex-between`, `@include bp(lg)`, `@include truncate`.
- Never hardcode colors, spacing, or font sizes — always use the token.

## TypeScript Conventions

- Strict mode is enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`).
- Use named exports, not default exports.
- Use `type` imports: `import type { Foo } from './types';`
- Place shared types in `ui/src/types/` or `server/src/types/`.
- Feature-specific types go in `pages/<feature>/types/`.

## Component Conventions

- Functional components only. No class components.
- Use React Hook Form with Zod for forms.
- State management: Redux Toolkit + RTK Query for server state.
- Use `useCallback` and `useMemo` for callbacks/derived data passed as props.
- Co-locate helpers (pure functions) in `helpers/` within the feature folder.

## Lint & Quality

- ESLint: `@eslint/js` + `typescript-eslint` + `react-hooks` + `react-refresh`.
- Run `npx eslint .` from `ui/` before committing frontend changes.
- Keep imports organized: external libs → absolute `@/` imports → relative imports.

## Backend Conventions

- Controllers are thin — delegate to services.
- Use `logger` from `config/logger.ts`, never `console.log`.
- Encrypt secrets with `utils/crypto.ts` (`encrypt`/`decrypt`).
- Background jobs go in `jobs/`, registered in `jobs/index.ts`.
- Prisma schema is the source of truth for the DB.

## Common Pitfalls

- **Blob URLs**: Never store browser-local `blob:` URLs in the database. Always use server-uploaded URLs (`/uploads/...` or S3 keys). Validate before saving.
- **OAuth tokens**: Always `decrypt()` before use, never log raw tokens.
- **Media uploads**: Use `uploadFileToServer()` helper in the UI; it returns a server-accessible URL.
