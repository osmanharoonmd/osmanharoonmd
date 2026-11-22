-- Starter official recruitment sources for Career Wave.
-- Deliberately disabled on insertion: an administrator must review and enable each source.
insert into public.job_sources (name, source_type, source_url, category, enabled)
select v.name, 'official_url', v.source_url, 'government', false
from (values
  ('UPSC — Recruitment Advertisements', 'https://upsc.gov.in/advertisements/'),
  ('Staff Selection Commission — Notice Board', 'https://ssc.gov.in/home/notice-board'),
  ('Employment News — All Jobs', 'https://employmentnews.gov.in/NewEmp/AllJobs.aspx?k=All'),
  ('Andhra Pradesh Public Service Commission — Recruitment Notifications', 'https://portal-psc.ap.gov.in/HomePages/RecruitmentNotifications'),
  ('State Bank of India — Current Openings', 'https://sbi.bank.in/web/careers/Current-openings'),
  ('Railway Recruitment Board Chandigarh — Employment Notices', 'https://www.rrbcdg.gov.in/employment-notices.php')
) as v(name, source_url)
where not exists (
  select 1 from public.job_sources s where s.source_url = v.source_url
);
