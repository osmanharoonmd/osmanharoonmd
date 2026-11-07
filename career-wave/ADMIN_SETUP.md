# Career Wave admin
Admin URL: https://career-wave-theta.vercel.app/admin.html

Supabase project: career-wave (Mumbai / ap-south-1). Database tables and RLS policies are installed.

## Promote the first administrator
1. Create an account on the admin page with your trusted email and password.
2. Confirm the email if Supabase requests it.
3. In Supabase SQL Editor, run:
```sql
update public.profiles set role='admin', updated_at=now() where email='YOUR_LOGIN_EMAIL';
```
New accounts default to viewer. Do not grant admin/editor access to unknown users.

The browser uses only the public Supabase publishable key. Never expose a service_role key. Ad slots are disabled by default; configure AdSense IDs after approval.

Implemented: admin sign-in, role gating, job create/edit/draft/publish/unpublish, verification and expiry fields, ad slot configuration/toggles, category listing and dashboard counts. Next modules: article editor, submission moderation, analytics, public site live database integration and scheduled expiry.


## Combined job publishing workflow

The Admin workspace includes a **Job intake** tab:

- **Manual:** Add an official source URL and notification notes to the review queue.
- **AI-assisted:** Prepare structured JSON from an official notification (for example, with ChatGPT), paste it into the AI-prepared draft field, and use **Prepare draft** to load it into the job editor. AI output is a draft only and must be checked against the source. No OpenAI API key is configured in the website, so the site does not autonomously generate AI content.
- **Automatic feed collection:** Add trusted public RSS / Atom feeds, then select **Collect feeds now**. Candidate feed items enter the review queue; they are never published automatically. The collector requires a signed-in admin/editor and only fetches public HTTPS URLs.

To publish a job, complete the official notification/source and application details, set verification to **verified**, save, and publish. The editor blocks publishing while verification is pending or rejected.

## Public listings

The public homepage requests currently published, unexpired jobs from Supabase. The existing demonstration cards remain as a fallback when there are no published records. Replace or remove those samples before public promotion so visitors are not mistaken into treating sample vacancies as real.

## Feed collector

Supabase Edge Function: `collect-job-feeds` (JWT verification enabled). It imports RSS / Atom candidates into `job_imports`, de-duplicates by source URL where possible, and records last-check status on each source. Collection is currently manually triggered from Admin; scheduled polling has not been configured.
