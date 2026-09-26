/**
 * Cloudflare Access JWT verification — fail closed.
 * Borrowed from klappy/prs src/auth.ts @da00584 (TS → JS, no deps).
 * Every gated request must carry `Cf-Access-Jwt-Assertion` signed (RS256) by one of the
 * team's current keys (https://<team>/cdn-cgi/access/certs), with `aud` containing
 * ACCESS_AUD, `iss` = https://<team>, and a valid exp/nbf. Missing config = deny.
 */

export const forbidden = () =>
  new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { "content-type": "application/json" } });

const b64urlBytes = (s) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));

const defaultFetcher = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`certs ${r.status}`);
  return r.json();
};

const CACHE_MS = 10 * 60_000;
const cache = new Map();
export function clearCertCache() { cache.clear(); }

async function keysFor(team, fetcher, nowMs, force = false) {
  const hit = cache.get(team);
  if (hit && !force && nowMs - hit.at < CACHE_MS) return hit.keys;
  const { keys } = await fetcher(`https://${team}/cdn-cgi/access/certs`);
  const out = new Map();
  for (const k of keys ?? []) {
    if (k.kty !== "RSA") continue;
    out.set(k.kid, await crypto.subtle.importKey("jwk", { kty: "RSA", n: k.n, e: k.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]));
  }
  cache.set(team, { at: nowMs, keys: out });
  return out;
}

/** Returns the verified claims, or null on any failure (never throws). */
export async function verifyAccessJwt(token, cfg, fetcher = defaultFetcher, nowMs = Date.now()) {
  try {
    const team = cfg.ACCESS_TEAM_DOMAIN?.trim().replace(/^https:\/\//, "").replace(/\/$/, "");
    const aud = cfg.ACCESS_AUD?.trim();
    if (!team || !aud || !token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const header = b64urlJson(parts[0]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
    let keys = await keysFor(team, fetcher, nowMs);
    if (!keys.has(header.kid)) keys = await keysFor(team, fetcher, nowMs, true); // key rotation
    const key = keys.get(header.kid);
    if (!key) return null;
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!ok) return null;
    const c = b64urlJson(parts[1]);
    const now = Math.floor(nowMs / 1000);
    const auds = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!auds.includes(aud)) return null;
    if (c.iss !== `https://${team}`) return null;
    if (typeof c.exp !== "number" || c.exp <= now) return null;
    if (typeof c.nbf === "number" && c.nbf > now + 60) return null;
    return c;
  } catch {
    return null;
  }
}

/** Resolves to null when allowed, or a 403 Response when denied. */
export function accessVerifier(cfg, fetcher = defaultFetcher, nowMs) {
  return async (req) => {
    const claims = await verifyAccessJwt(req.headers.get("Cf-Access-Jwt-Assertion"), cfg, fetcher, nowMs ? nowMs() : Date.now());
    return claims ? null : forbidden();
  };
}
