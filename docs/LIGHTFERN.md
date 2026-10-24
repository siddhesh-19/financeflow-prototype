# Lightfern integration

The Lightfern client imports the existing React components and deterministic workflow engine. Next.js routes run on the existing Vercel deployment and use the existing Supabase project. No database migration or new database is needed.

The added /api/lightfern/[endpoint] bridge supports opaque-origin browser requests with explicit bearer tokens. It ignores browser cookies, validates users with Supabase, derives roles from membership and delegates to the existing API handlers. Tokens stay in the Lightfern view's memory and are refreshed there. Reopening the app requires sign-in. Normal cookie-based web sessions retain their existing behavior.

The bridge returns CORS headers only for its own routes. Other API routes keep their same-origin protection. AsyncLocalStorage isolates bearer authentication per request. Existing tenant RLS, private document links, server-only controlled writes, version checks, idempotency and AI quotas still apply.

Deploy these changes to the existing FinanceFlow Vercel project using its existing environment variables. In Lightfern choose Workspace, then Check backend connection and sign in. Confirmation emails open the existing website; confirm there, then sign in in Lightfern. Invitation links can be accepted on the existing website, then the workspace can be opened in Lightfern.

The native demonstration is explicitly simulated and persists in Lightfern files, separate from Supabase workspace records. Its assistant uses the existing labeled rules adapter. The original marketing example and existing visual template builder are retained.

The imported backend patch applies to the existing repository. Its bearer-token parser was corrected to reject whitespace while accepting normal JWT characters. No database migration, permission change, new secret or new Supabase project is required.

Validation: TypeScript, 25 automated tests and production build pass. The opt-in live suite supports both transports: `npm run test:live` checks existing cookie sessions; `SMOKE_LIGHTFERN=1 npm run test:live` checks the bridge. Set `SMOKE_ORIGIN=https://financeflow-prototype-gules.vercel.app` for production. Temporary accounts and workspaces are cleaned up after testing. Coverage includes confirmation, sign-in, refresh/sign-out, opaque-origin CORS, cookie isolation, tenant RLS, private uploads, role enforcement, invitations, graph persistence, version conflicts and retries. The bridge delegates bootstrap, templates, instances, transition, documents, members, invitations, proposals and assistant requests to their existing handlers.

Public signup email delivery still depends on the existing Supabase SMTP configuration. The suite uses generated signup confirmation tokens without sending email. OpenAI remains unconfigured; the bridge does not enable AI or document extraction by itself. Native Lightfern UI behavior is separate from HTTP endpoint acceptance.
