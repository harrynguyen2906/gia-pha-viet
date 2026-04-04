# Tech Stack Guidelines (Gia Phả Việt)

This document serves as the foundational rulebook for AI agents and human developers working on the `gia-pha` monorepo. It ensures consistency, modern practices, and zero friction between packages.

## Monorepo Architecture

- **Tooling:** Turborepo (`turbo`) with **npm workspaces**.
- **Shared Packages:**
  - `@gia-pha/db`: Houses the entire Prisma schema, migrations, and seeding logic. Applications must import the Prisma client and types from here.
- **Node Version:** Node 20+

## Core Framework

- **Framework:** Next.js (version 16+)
- **Routing:** Strictly use Next.js **App Router** (`app/` directory).
- **Language:** TypeScript exactly (strict mode).

## Database & Data Fetching

- **ORM:** Prisma (v7.6.0+)
- **Database:** PostgreSQL (Supabase).
- **Authentication:** NextAuth.js (Auth.js) v5 Beta using the `@auth/prisma-adapter`.
- **Client-Side Fetching:** SWR. Always prefer server fetching where possible (Server Components/Server Actions), but use SWR for polling or client-side mutability.
- **State Management:** Zustand (for complex client global state).

## Styling & UI

- **CSS Framework:** Tailwind CSS (v4).
- **Components:** Functional React components.
- **Form Handling:** `react-hook-form` paired with `zod` for strict schema validation.
- **Icons:** `lucide-react` (Do not use other icon libraries to maintain consistency).
- **Maps:** Google Maps (`@vis.gl/react-google-maps`). Mapbox is deprecated.
- **Class Merging:** Always use `clsx` and `tailwind-merge` (typically combined into a `cn` utility) for conditional classes.

## Development Rules for AI Assistants

1. **Never use `export default` for functions/components unless required by Next.js** (e.g., `page.tsx`, `layout.tsx`). Use named exports.
2. **Server Actions vs API Routes:** Heavily prefer Server Actions over `/api` route handlers for mutations.
3. **Database Access:** When working in `apps/*`, never edit the `prisma.schema` locally. DB changes must ALWAYS happen inside `packages/db`.
4. **Code Quality:** All code must pass `eslint` with zero warnings (`--max-warnings=0`) and follow `prettier` formatting.
