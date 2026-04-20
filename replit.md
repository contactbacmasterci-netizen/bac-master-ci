# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/bacmaster-ci run dev` — run BacMaster CI locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## BacMaster CI

- **Artifact**: `artifacts/bacmaster-ci`
- **Stack**: Next.js App Router, Tailwind CSS, Lucide React, Supabase
- **Purpose**: Educational web app for Terminale students in Côte d'Ivoire with Supabase Auth, course listing, free methodology content, AI tutor, manual premium proof uploads, admin validation, and leaderboard.
- **Runtime**: Next.js server on the root preview path; `/api/tutor` and `/api/admin/validate-payment` run inside the BacMaster CI web app so the tutor works without depending on the separate Express workflow.
- **Required configuration**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` for trusted AI tutor usage enforcement from the API server
- **Supabase assumptions**:
  - Tables `profiles` and `courses` already exist.
  - Storage bucket `paiements-captures` already exists.
  - Profile fields used: `id`, `full_name`, `email`, `is_premium`, `points`, `payment_screenshot_url`, `is_admin`, `created_at`.
  - The AI tutor will use `profiles.ai_messages_count` when present, but falls back to server-side in-memory counts if that column is missing so the tutor remains usable.
  - Course fields used: `id`, `title`, `subject`, `description`, `level`, `pdf_url`, `created_at`.
