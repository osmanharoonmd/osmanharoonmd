# Career Wave Automation Centre

## What runs
- GitHub Actions checks enabled sources every four hours (UTC).
- The collector supports public RSS, Atom, and official recruitment pages.
- Discovered links are inserted into `job_imports` as `pending` candidates.
- Nothing is published automatically. An admin/editor must review the source and create/publish a job post manually.
- Each run records a summary in `audit_logs`; source check time and errors appear in Admin → Automation Centre.

## Setup and testing
1. Sign in at `/admin.html` using an approved admin/editor account.
2. Open **Automation Centre**.
3. Add a source only after confirming it is an official public recruitment/careers page or RSS/Atom feed.
4. Keep it disabled until reviewed. Enable one source at a time during the initial test.
5. Use **Check sources now** for a manual test, or dispatch the GitHub Actions workflow manually.
6. Inspect the Review Queue and original source. Reject irrelevant candidates; prepare drafts only after verification.

## Schedule and cost
- Schedule: every four hours; GitHub may delay scheduled starts.
- The workflow uses GitHub OIDC and the existing public Supabase publishable key. No admin password, service-role key, or AI API key is stored in GitHub.
- Discovery does not use paid AI extraction. AI-assisted extraction remains optional and requires its own securely configured API key.
- This is a link-candidate detector, not a full parser for every recruitment portal. JavaScript-rendered pages and unusual layouts may be missed.
- It does not guarantee ten opportunities per day; it can only collect items exposed by the enabled sources.
- Monitor GitHub Actions and Supabase free-tier usage.

## Initial official source shortlist
Add these individually in Admin after checking current terms and access rules. They are not pre-enabled.

| Organization | Official page | Suggested category |
|---|---|---|
| UPSC | https://upsc.gov.in/advertisements/ | Government |
| Staff Selection Commission | https://ssc.gov.in/home/notice-board | Government |
| Employment News | https://employmentnews.gov.in/NewEmp/AllJobs.aspx?k=All | Government |
| Andhra Pradesh Public Service Commission | https://portal-psc.ap.gov.in/HomePages/RecruitmentNotifications | Government |
| State Bank of India | https://sbi.bank.in/web/careers/Current-openings | Private |
| Railway Recruitment Board Chandigarh | https://www.rrbcdg.gov.in/employment-notices.php | Government |

This is only a starter list, not all-India coverage. Expand in batches after validating each source.
