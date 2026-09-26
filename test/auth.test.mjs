import assert from "node:assert";
import { verifyAccessJwt, accessVerifier, clearCertCache } from "../src/auth.js";

const team = "klappy.cloudflareaccess.com";
const aud = "aud-123";
const cfg = { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: aud };
const kp = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
const fetcher = async (url) => { assert.equal(url, `https://${team}/cdn-cgi/access/certs`); return { keys: [{ kid: "k1", kty: "RSA", n: jwk.n, e: jwk.e }] }; };
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
const now = 1_790_000_000;
async function jwt(claims, header = { alg: "RS256", kid: "k1" }) {
  const head = `${b64(header)}.${b64(claims)}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", kp.privateKey, new TextEncoder().encode(head));
  return `${head}.${Buffer.from(sig).toString("base64url")}`;
}
const good = { aud: [aud], iss: `https://${team}`, exp: now + 300, nbf: now - 10, email: "chris@klappy.dev" };
const at = now * 1000;

assert.equal((await verifyAccessJwt(await jwt(good), cfg, fetcher, at)).email, "chris@klappy.dev");
clearCertCache();
assert.equal(await verifyAccessJwt(await jwt({ ...good, aud: ["other"] }), cfg, fetcher, at), null, "wrong aud");
assert.equal(await verifyAccessJwt(await jwt({ ...good, iss: "https://evil" }), cfg, fetcher, at), null, "wrong iss");
assert.equal(await verifyAccessJwt(await jwt({ ...good, exp: now - 1 }), cfg, fetcher, at), null, "expired");
assert.equal(await verifyAccessJwt(await jwt(good, { alg: "HS256", kid: "k1" }), cfg, fetcher, at), null, "alg");
assert.equal(await verifyAccessJwt(await jwt(good, { alg: "RS256", kid: "nope" }), cfg, fetcher, at), null, "unknown kid");
const t = await jwt(good);
assert.equal(await verifyAccessJwt(t.slice(0, -4) + "AAAA", cfg, fetcher, at), null, "bad sig");
assert.equal(await verifyAccessJwt(t, { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: "" }, fetcher, at), null, "empty aud fails closed");
assert.equal(await verifyAccessJwt(null, cfg, fetcher, at), null, "no token");

const v = accessVerifier(cfg, fetcher, () => at);
assert.equal(await v(new Request("https://x/mcp", { headers: { "Cf-Access-Jwt-Assertion": t } })), null);
assert.equal((await v(new Request("https://x/mcp"))).status, 403);
console.log("access auth ok (11 cases)");
