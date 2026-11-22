import { createClient } from "npm:@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.9.6";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });
const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_AUDIENCE = "careerwave-job-discovery";
const GITHUB_REPOSITORY = "osmanharoonmd/osmanharoonmd";
const GITHUB_REF = "refs/heads/main";
const GITHUB_WORKFLOW = GITHUB_REPOSITORY + "/.github/workflows/careerwave-job-discovery.yml@" + GITHUB_REF;
const githubJwks = createRemoteJWKSet(new URL(GITHUB_ISSUER + "/.well-known/jwks"));

function isBlockedIp(host: string) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") ||
      h === "::1" || h.startsWith("::ffff:") || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80:") ||
      h === "169.254.169.254" || h === "metadata.google.internal") return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]), b = Number(m[2]);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19));
}
function safeFeedUrl(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (!u.port || u.port === "443") && !u.username && !u.password &&
      !isBlockedIp(u.hostname) && !u.hostname.endsWith(".internal");
  } catch {
    return false;
  }
}
async function isStaffRequest(token: string, supaUrl: string, anon: string) {
  const caller = createClient(supaUrl, anon, {
    global: { headers: { Authorization: "Bearer " + token } },
  });
  const { data: { user }, error } = await caller.auth.getUser();
  if (error || !user) return false;
  const { data: profile } = await caller.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return !!profile && ["admin", "editor"].includes(profile.role);
}
async function isScheduledGitHubRequest(token: string) {
  try {
    const { payload } = await jwtVerify(token, githubJwks, {
      issuer: GITHUB_ISSUER,
      audience: GITHUB_AUDIENCE,
    });
    return payload.repository === GITHUB_REPOSITORY &&
      payload.ref === GITHUB_REF &&
      payload.workflow_ref === GITHUB_WORKFLOW &&
      ["schedule", "workflow_dispatch"].includes(String(payload.event_name));
  } catch {
    return false;
  }
}
function decodeXml(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ").trim();
}
function parseEntries(xml: string) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
  return blocks.map((block) => {
    const title = decodeXml(block.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const href = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1];
    const link = href ?? decodeXml(block.match(/<link\b[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "");
    const description = decodeXml(block.match(/<(description|summary|content:encoded)\b[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ?? "");
    return { title, link, description, raw: decodeXml(block).slice(0, 12000) };
  }).filter((x) => x.title && x.link && /^https:\/\//i.test(x.link));
}
function parseOfficialPage(html: string, pageUrl: string) {
  const base = new URL(pageUrl);
  const positive = /recruitment|vacanc(?:y|ies)|job.?openings?|career.?openings?|advertisement|\\badvt\\b|notification|apply.?online|current.?openings|engagement|hiring|selection.?for.?posts/i;
  const negative = /result|admit.?card|call.?letter|answer.?key|response.?sheet|score.?card|marksheet|cut.?off|cutoff|syllabus|scribe|guideline|booklet|training.?material|acquaint|tender|procurement|press.?release/i;
  const found = new Map<string, { title: string; link: string; description: string; raw: string }>();
  const rowRanges: Array<[number, number]> = [];
  const clean = (v: string) => v.replace(/\\s+/g, " ").replace(/\\(\\s*\\d+(?:\\.\\d+)?\\s*(?:kb|mb)\\s*\\)/ig, "").trim();
  const addLink = (hrefRaw: string, anchorHtml: string, contextText = "") => {
    const href = hrefRaw.trim().replace(/&amp;/g, "&");
    const anchorTitle = clean(decodeXml(anchorHtml)).slice(0, 400);
    if (!href || /^(javascript:|mailto:|tel:|#)/i.test(href)) return;
    let link: URL;
    try { link = new URL(href, base); } catch { return; }
    if (link.protocol !== "https:" || (link.port && link.port !== "443") || link.username || link.password) return;
    const host = link.hostname.toLowerCase(), baseHost = base.hostname.toLowerCase();
    if (!(host === baseHost || host.endsWith("." + baseHost))) return;
    let pathName = "";
    try { pathName = decodeURIComponent(link.pathname.split("/").pop() || ""); } catch { pathName = link.pathname.split("/").pop() || ""; }
    pathName = pathName.replace(/\\.[^.]+$/, "").replace(/[_-]+/g, " ");
    const candidateText = [anchorTitle, contextText, pathName, link.pathname].join(" ");
    if (negative.test(candidateText) || !positive.test(candidateText)) return;
    if (link.href === base.href || found.has(link.href)) return;
    const genericAnchor = !anchorTitle || /^(english|hindi|download|view|click here|apply now|pdf|here|details?)$/i.test(anchorTitle);
    const title = clean(genericAnchor ? pathName : anchorTitle) || clean(pathName) || "Official recruitment notification";
    const context = clean(contextText).slice(0, 1200);
    found.set(link.href, { title, link: link.href, description: context || title,
      raw: "Discovered on official page: " + pageUrl + "\\nPage listing text: " + context +
        "\\nLink title: " + anchorTitle + "\\nOfficial link: " + link.href });
  };
  const rows = [...html.matchAll(/<tr\\b[^>]*>[\\s\\S]*?<\\/tr>/gi)];
  for (const row of rows) {
    const rowStart = row.index ?? 0, rowHtml = row[0];
    rowRanges.push([rowStart, rowStart + rowHtml.length]);
    const rowText = decodeXml(rowHtml).slice(0, 1200);
    const links = [...rowHtml.matchAll(/<a\\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi)];
    for (const link of links) addLink(link[1] ?? "", link[2] ?? "", rowText);
  }
  const anchors = [...html.matchAll(/<a\\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi)];
  for (const anchor of anchors) {
    const index = anchor.index ?? 0;
    if (rowRanges.some(([from, to]) => index >= from && index < to)) continue;
    addLink(anchor[1] ?? "", anchor[2] ?? "");
  }
  return [...found.values()].slice(0, 40);
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respond({ error: "POST required" }, 405);

  const supaUrl = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supaUrl || !anon || !service) return respond({ error: "Backend configuration missing" }, 500);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return respond({ error: "Authentication required" }, 401);
  const staff = await isStaffRequest(token, supaUrl, anon);
  const scheduled = staff ? false : await isScheduledGitHubRequest(token);
  if (!staff && !scheduled) return respond({ error: "Staff or approved GitHub scheduled-run identity required" }, 403);

  const db = createClient(supaUrl, service, { auth: { persistSession: false } });
  const { data: sources, error } = await db.from("job_sources").select("*").eq("enabled", true);
  if (error) return respond({ error: error.message }, 500);

  let imported = 0, skipped = 0;
  const errors: string[] = [];
  for (const source of sources ?? []) {
    try {
      if (!["rss", "atom", "official_url"].includes(source.source_type)) {
        skipped++;
        await db.from("job_sources").update({
          last_checked_at: new Date().toISOString(),
          last_error: "Unsupported source type. Use RSS, Atom, or an official public webpage.",
        }).eq("id", source.id);
        continue;
      }
      if (!safeFeedUrl(source.source_url)) throw new Error("Only public HTTPS source URLs are allowed");
      const response = await fetch(source.source_url, {
        headers: { "User-Agent": "CareerWaveJobFeedBot/1.0 (+https://careerwave.in)" },
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const declaredLength = Number(response.headers.get("content-length") ?? "0");
      if (declaredLength > 3_000_000) throw new Error("Feed exceeds the 3 MB size limit");
      const xml = await response.text();
      if (xml.length > 3_000_000) throw new Error("Feed exceeds the 3 MB size limit");
      const items = (source.source_type === "official_url" ? parseOfficialPage(xml, source.source_url) : parseEntries(xml)).slice(0, 40);
      for (const item of items) {
        const { data: exists, error: lookupError } = await db.from("job_imports")
          .select("id").eq("source_url", item.link).limit(1).maybeSingle();
        if (lookupError) throw lookupError;
        if (exists) { skipped++; continue; }
        const { error: insertError } = await db.from("job_imports").insert({
          source_id: source.id,
          intake_method: "automatic",
          source_url: item.link,
          source_title: item.title,
          raw_content: item.raw || item.description || item.title,
          extracted_data: { title: item.title, description: "", job_type: source.category, source_page_url: source.source_url, discovery_type: source.source_type, needs_extraction: true, extraction_status: "discovered" },
          status: "pending",
        });
        if (insertError) throw insertError;
        imported++;
      }
      await db.from("job_sources").update({
        last_checked_at: new Date().toISOString(), last_error: null,
      }).eq("id", source.id);
    } catch (e) {
      const message = String((e as Error)?.message ?? e).slice(0, 500);
      errors.push(source.name + ": " + message);
      await db.from("job_sources").update({
        last_checked_at: new Date().toISOString(), last_error: message,
      }).eq("id", source.id);
    }
  }

  await db.from("audit_logs").insert({
    actor_id: null,
    action: scheduled ? "scheduled_discovery_completed" : "manual_discovery_completed",
    entity_type: "job_discovery",
    entity_id: null,
    details: { imported, skipped, error_count: errors.length, errors: errors.slice(0, 20), source_count: sources?.length ?? 0 },
  });
  return respond({ imported, skipped, errors, sources_checked: sources?.length ?? 0, trigger: scheduled ? "github_schedule" : "staff_manual" });
});
