# Career Wave automated job discovery — preview implementation

## What this adds
- A GitHub Actions schedule that requests a run every four hours (UTC).
- GitHub OIDC authentication. No admin password, service-role key, or paid AI key is stored in GitHub.
- The existing Supabase feed collector continues to support signed-in admin/editor manual runs.
- Automatic discoveries are inserted into `job_imports` with `status = pending`; nothing is published.
- Each run writes a summary to `audit_logs`; per-source check time and error remain in `job_sources`.

## Required one-time configuration before activation
1. Add a GitHub repository variable named `CAREERWAVE_SUPABASE_PUBLISHABLE_KEY` with the project's public publishable key. This is a public client key, not a service-role secret.
2. Deploy the updated `collect-job-feeds` Edge Function with JWT gateway verification disabled. The function validates either a real Supabase staff session or a GitHub OIDC token itself. Do not deploy the OIDC-capable function without reviewing this validation.
3. Keep the GitHub workflow on the default `main` branch. The function accepts scheduled identity only for this exact repository, workflow file, and branch.
4. Add approved official RSS/Atom feeds in Admin → Job Intake. Reference-only official URLs are deliberately not fetched as feeds.
5. Run a manual workflow dispatch after activation and confirm the Admin queue and activity log.

## Schedule and cost
- Schedule: every four hours, with GitHub's normal schedule jitter/delay possible.
- Repository visibility is public, so GitHub-hosted standard runner usage is currently eligible for GitHub's public-repository free usage. Confirm current account billing settings before relying on it.
- This workflow uses no OpenAI API and no paid extraction service. It only discovers RSS/Atom feed items and queues them for human review.
- It does not promise ten jobs every day; it imports only the items actually exposed by configured sources.
- The Supabase function still uses the project's existing Edge Function and database resources; monitor free-tier usage.

## Safety
- Only staff can add or enable sources through existing RLS-protected admin access.
- The scheduled identity is checked against GitHub's signed OIDC token, exact repository, exact workflow, exact branch, event and audience.
- Feed redirects are rejected; only HTTPS public URLs are accepted.
- Every candidate remains private in the review queue. Manual approval is still required before creating a public job post.
