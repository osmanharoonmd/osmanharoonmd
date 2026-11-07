# Career Wave

Responsive Next.js job and career opportunities portal based on the supplied Career Wave design reference.

## Features
- Responsive homepage, listings and individual job pages
- Search, category tabs, job type / experience / location filters and sorting
- Share and copy-link controls
- Clearly labelled advertisement inventory placeholders on homepage, listing and detail pages
- Demo ad placement toggle screen at `/admin/ads`
- Sample vacancy data is explicitly marked as demonstration content

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Before production
- Replace demo vacancies with verified, current listings and official source URLs.
- Connect the ad slots to an approved ad provider (e.g. AdSense) only after approval.
- Implement authenticated, database-backed admin controls and persistent ad settings.
- Add legal pages, privacy/cookie controls, analytics and a content verification workflow.