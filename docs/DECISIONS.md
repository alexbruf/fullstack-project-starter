# Architecture Decision Records

This document captures significant technical decisions, the alternatives considered, and the rationale behind each choice.

> **Why this matters:** Code shows *what* was built. This shows *why* it was built that way. Future developers (including Claude) need this context to avoid re-litigating settled decisions or breaking assumptions.

---

## Template

```markdown
## [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Deprecated

### Decision
[What we chose - one sentence]

### Context
[What problem prompted this decision?]

### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Option A | ... | ... |
| Option B | ... | ... |

### Rationale
[Why this choice wins over alternatives]

### Trade-offs
[What we accept by making this choice]

### Production Path (if applicable)
[If this is MVP/simplified, what would production need?]
```

---

## Scaffolding Decisions

These document why the scaffolding works the way it does.

---

### File Length Limit: 300 Lines with Exclude-List Enforcement

**Date:** 2025-12-30
**Status:** Accepted

#### Decision
Enforce 300-line limit via recursive scan with exclude-list (`IGNORE_PATTERNS`), not include-list (`CHECK_DIRS`).

#### Context
Need to prevent "god files" while ensuring new directories are automatically covered.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| No limit | No friction | God files emerge, unmaintainable |
| 500-line limit | More permissive | Doesn't force architectural thinking |
| Include-list (`CHECK_DIRS`) | Explicit control | New directories silently ignored |
| **Exclude-list (chosen)** | Auto-covers new dirs | Must maintain ignore list |

#### Rationale
- 300 is small enough to force splits, large enough for real logic
- Exclude-list automatically covers new directories (learned the hard way)
- Forces modular architecture decisions, not just code extraction

#### Trade-offs
- Some files feel artificially constrained
- Splits can create indirection if done poorly

---

### LESSONS-LEARNED: Append-Only, Never Split

**Date:** 2025-12-30
**Status:** Accepted

#### Decision
LESSONS-LEARNED.md is append-only. Never edit existing entries, never split the file.

#### Context
Need to capture mistakes in a way that's searchable and preserves original context.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Wiki-style (edit/refine) | Entries improve over time | Original context lost |
| Split by category | Organized | Defeats "searchable history" goal |
| Split by year | Manageable size | Breaks continuity |
| **Append-only (chosen)** | Single searchable history | File grows indefinitely |

#### Rationale
- Single searchable history is the point
- Editing risks losing original context and nuance
- "Never split" removes decision fatigue

#### Trade-offs
- File grows indefinitely (acceptable for text)
- Old entries may become irrelevant (but still valuable as history)

---

### CLAUDE.md: Rules, Not Context

**Date:** 2025-12-30
**Status:** Accepted

#### Decision
CLAUDE.md contains strict rules only, not general context or documentation. Must remain extremely short.

#### Context
Claude's attention is finite. Long documents get skimmed or ignored.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Comprehensive context doc | One-stop-shop | Too long, gets ignored |
| Combined rules + context | Convenient | Rules buried in prose |
| **Rules only (chosen)** | Short, enforceable | Requires reading multiple files |

#### Rationale
- Claude ignores long documents; short rules are more likely followed
- Detailed explanations belong in referenced files
- Enforcement > documentation

#### Trade-offs
- New users must read multiple files to get full context
- Less "one-stop-shop" feel

---

### Quality Gates: Automated Enforcement, Not Advisory

**Date:** 2025-12-30
**Status:** Accepted

#### Decision
All quality rules are enforced via pre-commit hooks and CI, not just documented as guidelines.

#### Context
Documentation-only rules get ignored, especially by AI agents under time pressure.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Guidelines only | Flexible, no friction | Rules drift, get ignored |
| CI-only enforcement | Catches on push | Late feedback, context switch |
| **Pre-commit + CI (chosen)** | Immediate + backup | Requires setup |

#### Rationale
- "Green tests tunnel vision" - Claude rushes to commit when tests pass
- Pre-commit catches issues immediately, before commit message is written
- CI provides backup enforcement and visibility

#### Trade-offs
- Initial setup friction
- Occasional false positives require investigation

---

### Inventory-Based Drift Detection

**Date:** 2025-12-30
**Status:** Accepted

#### Decision
Track components/endpoints in JSON inventory files. Tests fail if code doesn't match inventory.

#### Context
Need to catch "I added a feature but forgot to test/document it" scenarios.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Trust developers to update docs | No overhead | Drift happens silently |
| Auto-generate from code | Always accurate | Loses intentionality, descriptions |
| **Manual inventory + tests (chosen)** | Explicit, verified | Requires maintenance |

#### Rationale
- Forces explicit acknowledgment of new code
- Descriptions capture intent, not just existence
- Test failures are impossible to ignore

#### Trade-offs
- Manual updates required for every change
- Count mismatches can be confusing (improved with type validation)

---

## Project Decisions

These document architectural choices specific to this project.

---

### Biome over ESLint + Prettier

**Date:** 2026-01-18
**Status:** Accepted

#### Decision
Use Biome as the single tool for linting and formatting instead of ESLint + Prettier.

#### Context
Need consistent code quality tooling that works well with Bun and modern tooling.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| ESLint + Prettier | Industry standard, extensive plugins | Two tools, slower, complex config |
| **Biome (chosen)** | Single tool, 10-100x faster, simple config | Fewer plugins, newer ecosystem |
| dprint | Very fast | Less lint coverage |

#### Rationale
- Single config file vs multiple configs
- Rust-based performance matches Bun's philosophy
- Tailwind CSS support built-in
- Simpler CI/CD pipeline

#### Trade-offs
- Fewer ESLint plugins available
- Team may need to learn new tool

---

### Vitest over Jest

**Date:** 2026-01-18
**Status:** Accepted

#### Decision
Use Vitest as the test framework instead of Jest.

#### Context
Need a test framework that integrates well with Vite and supports modern TypeScript.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Jest | Industry standard, mature | Requires separate config, slower |
| **Vitest (chosen)** | Native Vite integration, fast, ESM-first | Newer, smaller ecosystem |
| Bun test | Built into Bun | Less mature, fewer features |

#### Rationale
- Shares Vite config (no duplicate setup)
- First-class ESM and TypeScript support
- Compatible with Jest API (easy migration)
- Faster test execution

#### Trade-offs
- Smaller ecosystem than Jest
- Some Jest plugins may not work

---

### API-First Architecture with Hono

**Date:** 2026-01-18
**Status:** Accepted

#### Decision
Build all features API-first using Hono. The frontend is a consumer of the API, not the source of truth.

#### Context
Need an architecture where the app is fully controllable via API, not just the frontend UI.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Frontend-first (React actions) | Simpler for UI-only apps | Can't automate, no external access |
| Backend-for-frontend only | Optimized for UI | Tight coupling, duplicate logic for API |
| **API-first (chosen)** | Full external access, testable | Slightly more boilerplate |

#### Rationale
- External clients (mobile, CLI, integrations) get full functionality
- Business logic is centralized and testable without UI
- Frontend remains thin - just consumes API
- Auth supports both session (frontend) and API keys (external) via `acceptsToken: "api_key"`
- Type exports (`export type XResponse`) give frontend type safety

#### Trade-offs
- More boilerplate than inline React actions
- Must maintain API inventory
- Must think about external consumers when designing endpoints

---

### Hono over Express/Fastify

**Date:** 2026-01-18
**Status:** Accepted

#### Decision
Use Hono as the API framework on Cloudflare Workers.

#### Context
Need a lightweight, edge-compatible web framework for API-first architecture.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Express | Most popular, huge ecosystem | Not designed for edge, heavy |
| Fastify | Fast, good DX | Node.js focused |
| **Hono (chosen)** | Edge-first, tiny, multi-runtime | Smaller ecosystem |
| itty-router | Minimal | Too minimal for larger apps |

#### Rationale
- Built for Cloudflare Workers
- Works across Bun, Deno, Node.js, edge
- Middleware ecosystem (including @hono/clerk-auth)
- TypeScript-first

#### Trade-offs
- Smaller community than Express
- Fewer middleware options

---

### Kysely over Drizzle/Prisma

**Date:** 2026-01-18
**Status:** Accepted

#### Decision
Use Kysely as the SQL query builder for D1.

#### Context
Need type-safe database access that works with Cloudflare D1 (SQLite).

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| Prisma | Popular, great DX | Heavy, D1 support limited |
| Drizzle | Lightweight, good types | Newer, D1 dialect evolving |
| **Kysely (chosen)** | Mature, excellent D1 support | More verbose than ORMs |
| Raw SQL | No dependencies | No type safety |

#### Rationale
- First-class D1 support via kysely-d1
- Type-safe query building
- Lightweight (important for Workers)
- SQL-like syntax (no abstraction leakage)

#### Trade-offs
- More verbose than Prisma/Drizzle
- No automatic migrations

---

### Data Fetching: React Router + TanStack Query

**Date:** 2026-01-18
**Status:** Accepted

#### Decision
Use React Router loaders/actions for route-level data and TanStack Query for component-level client-side data fetching.

#### Context
Need a clear strategy for data fetching that handles SSR, client-side caching, and dynamic UI without conflicting patterns.

#### Alternatives Considered
| Option | Pros | Cons |
|--------|------|------|
| React Router only | Single paradigm, route integration | No caching, awkward for non-route data |
| TanStack Query only | Powerful caching, great DX | Misses RR SSR benefits, route integration lost |
| **Both (chosen)** | Best of both worlds | Two systems to learn |
| Raw fetch + useEffect | Simple, no deps | No caching, loading state boilerplate |
| SWR | Simpler API | Less powerful than TanStack Query |

#### Rationale

**React Router excels at:**
- SSR data loading (critical for SEO, initial paint)
- Route-based data coordination (data ready before render)
- Navigation-triggered fetching (no waterfalls)
- Mutations that should revalidate route loaders

**TanStack Query excels at:**
- Component-level caching (shared data across components)
- Background refetching (stale-while-revalidate)
- Polling and real-time updates
- Optimistic mutations with rollback
- Request deduplication

**The boundary is clear:**
- "Data appears when you navigate to the page" → React Router
- "Data is fetched by a component wherever it lives" → TanStack Query
- "Mutation should refresh the whole route" → fetcher.Form
- "Mutation should update cache and show optimistic UI" → useMutation

#### Trade-offs
- Two data fetching paradigms to understand
- Need clear documentation on when to use which
- TanStack Query adds bundle size (~12KB gzipped)

---

## Superseded Decisions

Decisions that were later changed. Keep these for historical context.

<!-- Example:
### [Old Decision] → Superseded by [New Decision]

**Original Date:** YYYY-MM-DD
**Superseded:** YYYY-MM-DD

[Brief explanation of why the decision changed]
-->
