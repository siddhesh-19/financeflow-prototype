# FinanceFlow product specification — v0.3

24 October 2026 · Hackathon application · Built on the original prototype.

## Product

FinanceFlow coordinates financial requests and approvals across roles, documents, policy checks, and operational history. It provides an intelligence and coordination layer, not payment execution infrastructure. The original $100,000 US marketing workflow remains the flagship sample.

## Modes

**Demo:** no account required; fictional Northstar Cloud campaign; simulated role switcher; templates, instances, messages, and reset stored in this browser under financeflow.demo.v2. Each browser's data is isolated. Demo transitions are validated by a server route but submitted demo snapshots are inherently untrusted and never become private workspace records. The demo assistant is a clearly labeled deterministic rules adapter; AI-analysis demo stages record simulated analysis.

**Workspace:** Supabase Auth accounts with HTTP-only cookies; workspace memberships and custom role names; PostgreSQL persistence; server-validated actions; private document uploads; OpenAI chat and extraction when configured. No fallback to local storage for private records. Workspace owners can create invitation links tied to an email and expiring after seven days. No invitation email is sent automatically.

## Workflow builder and instances

Templates have a name, description, currency (USD/GBP/EUR), requested amount, draft/published state, and up to 30 executable nodes. The full-screen React Flow canvas provides Start, Task, Approval, AI Agent, Document, Condition and End nodes, draggable positions, output connections, zoom, pan, minimap, automatic layout, duplicate/delete, and a node inspector for instructions, roles, evidence, escalation and financial policy. Start and End are unique boundaries. The original verification/notification/completion stage types remain supported in existing templates.

A template's optional `graph` stores node positions and outcome edges inside its existing PostgreSQL JSON definition. Starting an instance freezes that graph too. Legacy templates without a graph keep sequential execution; opening them in the canvas maps their existing outcomes to edges. Linear steps can be reordered with arrows; branched workflows are reordered by reconnecting their outputs.

Success follows the connected edge. Condition nodes branch above versus at/below the requested-amount threshold; above-threshold completion still requires the escalated role's explicit approval. Rejection can return to the same approval for resubmission, travel through revision tasks and return to the rejected approval, or cancel at End. Returning to a rejected approval requires resubmission before approval. Request changes retains the existing blocked-stage behavior. AI Agent nodes require analysis and explicit completion; they do not run autonomous tools.

Publishing rejects incomplete outputs, missing or duplicate nodes, multiple edges on one output, forward cycles, unreachable nodes and successful paths that bypass required approvals, evidence, analysis or financial controls. A rejection branch must return to its approval before any End and cannot repeat financial effects. Drafts may have disconnected nodes. Edges define execution; canvas position does not. Every transition still applies the existing membership, role/person, evidence, human confirmation, money, idempotency and version checks. Graphs run one active node at a time; parallel fan-out and arbitrary cycles are not supported.

Starting an instance freezes its template. Later template edits affect future instances only. State includes current stage, execution statuses, assigned person, decisions, documents, blockers, timestamps, financial amounts, version, and audit history.

## Permissions and transitions

Roles come from the authenticated workspace membership. Completing, approving, rejecting, reviewing evidence, and running extraction require the stage's effective role and assigned person, if one is set. Requesters can submit revisions, upload evidence, and record follow-ups. Administrators manage templates, roles, reassignment, and cancellation; being an administrator alone does not override approval roles. New owners receive all default business roles for initial use.

Supported operations: start, submit/resubmit, approve, reject, request changes, reassign, complete, cancel, add/review documents, record analysis, record follow-up draft. Rejected stages cannot advance until resubmitted. Required documents must be reviewed. Extracted fields require a separate human review. Wrong currency or mismatched invoice/PO/confirmation amounts block completion. Uploading a replacement of the same type makes earlier evidence unverified.

Workspace writes use optimistic version checks, an atomic PostgreSQL function, and request IDs to prevent duplicate application. Audit and approval rows are written in the same transaction. Direct authenticated client writes to the workflow tables are not granted.

## Financial model

All amounts are integer cents/pence; maximum supported request is 10 billion major units. No exchange-rate conversion exists. Dashboard aggregation is separated by currency.

- Requested: amount configured for the instance's frozen template.
- Approved: authorized budget recorded by an approval or verification stage.
- Received: authorized receipt record, bounded by approved funding and requiring reviewed Funding Confirmation evidence.
- Allocated: budget earmarked for execution, bounded by approved and received funding.
- Committed: cumulative expenditure commitments, bounded by allocation and receipt.
- Available: received minus committed. Allocation is shown separately and is not treated as spending.

Follow-ups, invoice creation, AI extraction, and approvals do not imply money was received. No bank connection or real transfer exists.

## Flagship scenario

Funding Request → Plan & Budget → Finance Review (CFO above $75,000) → Management Approval → Partner Request → PO Verification → Invoice Verification → Partner Approval → Funding Confirmation → Marketing Handoff.

The opening demo has completed internal review and the partner request. It records $100,000 internally approved, $0 received, and a blocked PO verification stage. Its history includes a fictional policy and prior decisions. The remaining documents can be added as fictional samples and reviewed. Funding confirmation records receipt only after evidence review and explicit confirmation. Marketing handoff allocates the received budget.

A second Vendor Payment Preparation template exercises the same engine. It ends with preparation; it never claims to pay a vendor.

## AI

Signed-in workspace users can ask questions against authorized workflow snapshots, recent audit history, document text/extractions, policy configuration, and previous messages. A bounded Responses API tool loop exposes get_workflow_details, get_workflow_history, get_stage_requirements, get_financial_context, read_document, check_approval_policy, draft_approval_request, and propose_workflow_action. Tools are read-only. The final output is schema-validated and evidence IDs are restricted to existing records.

Proposals are saved with the workflow version and require explicit human confirmation. The server reloads the proposal and applies it through normal permission, prerequisite, idempotency, and version checks. A follow-up is an internal draft, never an external message. AI history is persisted. AI calls are limited to 12 per user per minute in PostgreSQL.

## Documents

Authenticated workspace members can attach PDF, CSV, and XLSX files up to 4 MB to the active stage. Files are stored privately. Authorized previews use 60-second signed URLs; CSV text and extracted fields are also visible in the app. XLSX/PDF originals open/download from the private file link.

Users explicitly request OpenAI extraction, which sends the chosen file to the configured OpenAI project. Fields include type, issuer, total in minor units, currency, dates, PO/invoice number, company, payment terms, and warnings. Extraction never updates financial totals. Users must review the source evidence and extracted values. AI field extraction may miss content or misread amounts; replace/correct source evidence when discrepancies are found.

## Acceptance and limits

Run the complete marketing and vendor flows; exercise rejection/resubmission, missing/unreviewed documents, wrong role, person assignment, threshold escalation, wrong tenant, stale versions, duplicate request IDs, money arithmetic, and reset. Verify template editing does not mutate active instances. Check persistence across refresh and RLS in separate accounts/workspaces.

Live Auth, Storage, and OpenAI acceptance tests require configured services. SQL tests with PGlite verify migrations and RLS but do not prove external service setup. No email, Slack, Xero, bank feed, Round MCP, real payment execution, multi-currency conversion, parallel BPMN execution, background automation, or full accounting ledger is in this version.

## Lightfern import

The Lightfern client uses a bearer-authenticated bridge on the existing Vercel backend. Native demo files remain separate from private workspaces in the existing Supabase database and private storage. The bridge ignores browser cookies, validates explicit bearer sessions and retains membership-derived roles, tenant RLS and all existing execution controls. Ordinary web authentication remains cookie-based. See LIGHTFERN.md for validation commands and configuration limits. Reopening the native view requires sign-in; credentials and session tokens are not saved to library files.
