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
