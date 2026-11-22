# Career Wave automated job discovery — preview implementation

## What this adds
- A GitHub Actions schedule that requests a run every four hours (UTC).
- GitHub OIDC authentication. No admin password, service-role key, or paid AI key is stored in GitHub.
- The collector supports RSS/Atom feeds and approved official recruitment pages, while continuing to support signed-in admin/editor manual runs.
- Automatic discoveries are inserted into `job_imports` with `status = pending`; nothing is published.
- Each run writes a summary to `audit_logs`; per-source check time and error remain in `job_sources`.

## Required one-time configuration before activation
1. Deploy the updated `collect-job-feeds` Edge Function with JWT gateway verification disabled. The function validates either a real Supabase staff session or a GitHub OIDC token itself. Do not deploy the OIDC-capable function without reviewing this validation.
2. Keep the GitHub workflow on the default `main` branch. The function accepts scheduled identity only for this exact repository, workflow file, and branch.
3. Add approved official RSS/Atom feeds or public recruitment pages in Admin → Automation Centre. Official-page checks collect matching same-domain notification, vacancy, recruitment and PDF links as candidates.
4. Run a manual workflow dispatch after activation and confirm the Admin queue and activity log.

The workflow uses the same public Supabase publishable key already embedded in the public admin client. It does not store or expose the service-role key or any admin login credentials.

## Schedule and cost
- Schedule: every four hours, with GitHub's normal schedule jitter/delay possible.
- Repository visibility is public, so GitHub-hosted standard runner usage is currently eligible for GitHub's public-repository free usage. Confirm current account billing settings before relying on it.
- This workflow uses no OpenAI API and no paid extraction service. It only discovers RSS/Atom feed items and queues them for human review.
- Official-page discovery is a link-candidate detector, not a full job-notification parser. Some notices and application links may be missed; all imported candidates require human verification.
- It does not promise ten jobs every day; it imports only the items actually exposed by configured sources.
- The Supabase function still uses the project's existing Edge Function and database resources; monitor free-tier usage.

## Safety
- Only staff can add or enable sources through existing RLS-protected admin access.
- The scheduled identity is checked against GitHub's signed OIDC token, exact repository, exact workflow, exact branch, event and audience.
- Feed redirects are rejected; only HTTPS public URLs are accepted.
- Every candidate remains private in the review queue. Manual approval is still required before creating a public job post.

## Initial official source shortlist (for admin review)
These are official public recruitment pages identified for the first source batch. Add them as `official_url` sources after checking the current terms and access guidance for each portal:

| Organization | Official page | Category |
|---|---|---|
| UPSC | https://upsc.gov.in/advertisements/ | Government |
| Staff Selection Commission | https://ssc.gov.in/home/notice-board | Government |
| Employment News (Ministry of Information & Broadcasting) | https://employmentnews.gov.in/NewEmp/AllJobs.aspx?k=All | Government |
| Andhra Pradesh Public Service Commission | https://portal-psc.ap.gov.in/HomePages/RecruitmentNotifications | Government |
| State Bank of India | https://sbi.bank.in/web/careers/Current-openings | Private |
| Railway Recruitment Board, Chandigarh | https://www.rrbcdg.gov.in/employment-notices.php | Government |

This is a starter set, not complete all-India coverage. Add state commissions, other RRB regions, public-sector employers, universities and private-company career pages in batches after validating each source. The generic official-page parser only finds candidate links on the same official domain; sites with JavaScript-rendered listings or unusual structures will need a dedicated adapter.
