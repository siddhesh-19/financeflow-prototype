# FinanceFlow teammate handoff — v0.3

Updated 24 October 2026. This extends the existing application. Read IDEA_GUIDELINES.md, PRODUCT_SPEC.md, and DEPLOYMENT.md before changing it. The original demo is preserved at /prototype.

## Current implementation

- Modern dashboard with active instances, blocked stages, approval counts, and summaries grouped by currency.
- React Flow canvas: seven node types, drag/drop, connections, positions, zoom/pan/minimap, inspector, reorder, duplicate/delete, thresholds, approval/rejection paths, financial effects, drafts and publishing.
- Generic server-validated sequential/graph engine, immutable instance template snapshots, revisions, role/person checks, cancellation, reassignment, audit history, optimistic locking and idempotency.
- Public demo adapter with isolated browser persistence and explicitly simulated roles/assistant.
- Supabase email auth through HTTP-only cookies, private workspaces, email-bound invitation links, role management, RLS-scoped reads, atomic server-only writes, and private storage.
- Real OpenAI Responses adapter with bounded read tools, structured evidence-linked answers, stored messages/proposals, confirmation through the engine, and per-user quotas.
- PDF/CSV/XLSX upload, signed private file links, structured extraction and human review. No automatic money mutation from extracted fields.

## Configuration status

Supabase project `mhlcadlwrjsjelzawpwh` (FinanceFlow, eu-west-1) is configured. The existing migration is applied; email/password and email confirmation are enabled; exact production/local confirmation redirects are configured. Credentials are in ignored `.env.local` and encrypted Production environment variables in the existing Vercel project. The server service variable accepts the existing modern secret API key. Nothing is exposed through NEXT_PUBLIC variables.

Live smoke tests pass for real accounts confirmed through generated signup tokens, sign-in, workspace creation, graph persistence, transitions, private storage, RLS, roles, retries and version conflicts. SMTP/email delivery is not tested and requires the owner's mail-provider configuration for unrestricted public registration. OpenAI remains unconfigured. See IMPLEMENTATION_REPORT.md for current deployment verification.

## Code map

| Path | Responsibility |
| --- | --- |
| components/platform/Platform.tsx | Dashboard, workflow detail, modes, account controls, documents and people |
| components/platform/WorkflowBuilder.tsx | Visual template editor |
| components/platform/Assistant.tsx | Chat, evidence references, proposal confirmation entry point |
| lib/platform/schema.ts | Zod domain and action schemas |
| lib/platform/graph.ts | Graph generation, layout and published-path/control validation |
| lib/platform/engine.ts | Deterministic transitions, role checks, blockers and financial rules |
| lib/platform/seed.ts | Marketing/vendor templates and fictional seeded demo |
| lib/platform/assistant.ts | Explicit demo-only rules adapter |
| lib/server/supabase.ts | Authenticated user client and server-only admin client |
| lib/server/repository.ts | Authorized reads, membership-bound actors and atomic persistence |
| lib/server/ai.ts | OpenAI read tools, schema-validated answers and document extraction |
| app/api/* | Authentication, bootstrap, templates, instances, transitions, documents, AI, proposals, roles, invitations |
| supabase/migrations/202610240001_financeflow.sql | Tables, RLS, storage policy and transaction functions |
| tests/engine.test.ts | Monetary, permission, branching, blocker and idempotency tests |
| tests/database.test.ts | Embedded PostgreSQL migration/RLS/atomicity/invitation checks |
| components/FinanceFlow.tsx, lib/workflow.ts | Original v0.1 prototype and sample document content |

## How to extend safely

Keep the engine independent from React and external services. All live state must be loaded from the database and roles derived from membership. Never accept a workspace snapshot or actor role from the browser. Demo snapshots are intentionally client-owned and must stay on the demo path.

Templates are configurable data; never evaluate user code. Stage IDs are generic in the new engine. The old prototype still uses hardcoded IDs and is intentionally separate. Editing a published template must not alter running instances.

Persist a state update with its audit entries, stage executions, documents, and approvals in one transaction. Check version and request ID. AI proposals have their own stored version and cannot be applied after unrelated changes without regeneration.

For new financial effects, define invariants first. Current available = received − committed; allocation is an earmark, not an expense. A receipt is a manually confirmed record, never bank verification. Do not combine currencies.

## Verification and remaining limits

The automated suite now has 25 passing tests, including bearer-token parsing, concurrent request isolation, graph execution and graph JSON persistence under tenant RLS. `npm run test:live` explicitly creates two synthetic accounts and workspace fixtures against configured Supabase, exercises the local app (override `SMOKE_ORIGIN` for production), and cleans up only its own records. It uses generated signup tokens without sending email. Run the app before this optional suite. Set `SMOKE_LIGHTFERN=1` to exercise the bearer-authenticated bridge, including token refresh and sign-out.

The canvas supports success, threshold, rejection-to-revision and rejection-to-cancel routes. Required controls cannot be bypassed, forward cycles and parallel fan-out are rejected, and revision loops cannot repeat financial effects. Existing running instances retain their frozen legacy templates. No Gmail, Slack, Xero, external sending, bank feed or payment integration was added. OpenAI and production SMTP remain external configuration.

## Local commands

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Stop the dev server before `npm run check`. For production locally, use `npm run build` then `npm start`.

## Lightfern import

The Lightfern backend patch is integrated, with corrected bearer-token parsing and dedicated authentication tests. The bridge runs on the existing Vercel backend and delegates to existing server-validated APIs using the same Supabase database and private storage. It accepts explicit bearer sessions from opaque origins and ignores browser cookies. Native demo files remain separate from private workspace records. See LIGHTFERN.md for endpoint verification and remaining SMTP/OpenAI configuration. Reopening the native view requires sign-in; credentials and session tokens are not saved to library files.
