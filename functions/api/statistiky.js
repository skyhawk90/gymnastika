// Cloudflare Pages Function: GET /api/statistiky?days=7|30|90
// Reads Cloudflare Web Analytics through the GraphQL Analytics API and returns a
// compact JSON summary for the /statistiky/ page.
//
// Access control: the route sits behind Cloudflare Access (on gymnastika.pages.dev),
// and this function verifies the Access JWT itself, so the data is never served on a
// host or path where Access is missing or misconfigured.
//
// Environment (Pages → Settings → Variables and Secrets):
//   CF_API_TOKEN        secret, API token with "Account Analytics: Read"
//   CF_ACCOUNT_ID       Cloudflare account id
//   CF_SITE_TAG         Web Analytics site tag of this Pages project
//   ACCESS_TEAM_DOMAIN  e.g. "gymnastika.cloudflareaccess.com"
//   ACCESS_AUD          Application Audience (AUD) tag of the Access application

const ALLOWED_DAYS = [7, 30, 90];

const QUERY = `query ($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
  viewer {
    accounts(filter: { accountTag: $account }) {
      total: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 1) { count sum { visits } }
      byDay: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 100, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
      paths: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [count_DESC]) { count sum { visits } dimensions { key: requestPath } }
      referers: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { key: refererHost } }
      countries: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 10, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { key: countryName } }
      devices: rumPageloadEventsAdaptiveGroups(filter: $filter, limit: 5, orderBy: [sum_visits_DESC]) { count sum { visits } dimensions { key: deviceType } }
    }
  }
}`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function b64urlBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

// Returns the verified Access JWT payload, or null.
async function verifyAccess(request, env) {
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  try {
    const header = b64urlJson(h);
    const payload = b64urlJson(p);
    if (header.alg !== "RS256") return null;

    const certsUrl = `https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
    const certs = await fetch(certsUrl, { cf: { cacheTtl: 3600 } }).then((r) => r.json());
    const jwk = (certs.keys || []).find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlBytes(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    if (!valid) return null;

    const now = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ACCESS_AUD)) return null;
    if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.nbf === "number" && payload.nbf > now + 60) return null;
    return payload;
  } catch {
    return null;
  }
}

const rows = (list) =>
  (list || []).map((r) => ({
    key: r.dimensions?.key || "",
    visits: r.sum?.visits ?? 0,
    views: r.count ?? 0,
  }));

export async function onRequestGet({ request, env }) {
  const user = await verifyAccess(request, env);
  if (!user) return json({ error: "unauthorized" }, 401);

  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID || !env.CF_SITE_TAG) {
    return json({ error: "not_configured" }, 500);
  }

  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days = ALLOWED_DAYS.includes(requested) ? requested : 30;

  const to = new Date();
  // `days` whole calendar days (UTC) including today, so the first bar is not a partial day
  const from = new Date(to.getTime() - (days - 1) * 86400_000);
  from.setUTCHours(0, 0, 0, 0);

  const filter = {
    AND: [
      { datetime_geq: from.toISOString(), datetime_leq: to.toISOString() },
      { siteTag: env.CF_SITE_TAG },
      { bot: 0 },
    ],
  };

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CF_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { account: env.CF_ACCOUNT_ID, filter } }),
  });
  const data = await res.json().catch(() => null);
  const acc = data?.data?.viewer?.accounts?.[0];
  if (!res.ok || !acc || data.errors?.length) {
    console.error("analytics query failed", res.status, JSON.stringify(data?.errors || data));
    return json({ error: "upstream" }, 502);
  }

  return json({
    user: user.email || null,
    days,
    from: from.toISOString(),
    to: to.toISOString(),
    total: { visits: acc.total?.[0]?.sum?.visits ?? 0, views: acc.total?.[0]?.count ?? 0 },
    byDay: (acc.byDay || []).map((r) => ({
      date: r.dimensions.date,
      visits: r.sum?.visits ?? 0,
      views: r.count ?? 0,
    })),
    paths: rows(acc.paths),
    referers: rows(acc.referers),
    countries: rows(acc.countries),
    devices: rows(acc.devices),
  });
}
