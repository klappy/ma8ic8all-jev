// Ma8ic 8all: a Jev MCP service in a gag costume. Streamable HTTP, JSON responses, no deps.
import MAGIC8 from "../contracts/CONTRACT-magic8@1.md";
import DOCS from "../docs/GUIDE.md";

const MODEL = "typesafe/jev";
const TYPES = new Set(["noul", "score", "choice"]);

// ---- contract parsing: bands + phrases + criteria come from the contract file, not code ----
export function parseContract(body) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(body);
  const meta = {};
  if (fm) for (const l of fm[1].split("\n")) { const m = /^(\w+):\s*(.*)$/.exec(l); if (m) meta[m[1]] = m[2].trim(); }
  const bands = [];
  for (const m of body.matchAll(/^\|\s*(yes|hazy|no)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*(.*?)\s*\|$/gm))
    bands.push({ band: m[1], min: +m[2], max: +m[3], meaning: m[4] });
  const phrases = {};
  for (const m of body.matchAll(/^### (yes|hazy|no)\n((?:- .*\n?)+)/gm))
    phrases[m[1]] = m[2].trim().split("\n").map((s) => s.replace(/^- /, ""));
  const crit = {};
  const c = /## Criteria[^\n]*\n([\s\S]*?)\n## /.exec(body);
  if (c) for (const m of c[1].matchAll(/^- (true|false): (.*)$/gm)) crit[m[1]] = m[2];
  return { name: meta.contract, version: meta.version, bands, phrases, criteria: crit };
}
const C_MAGIC8 = parseContract(MAGIC8);

async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function bandOf(p, c) {
  for (const b of c.bands) if (p >= b.min && (p < b.max || (b.max >= 1 && p <= b.max))) return b;
  return c.bands[c.bands.length - 1];
}
function phraseOf(p, c, seed) {
  const b = bandOf(p, c); const list = c.phrases[b.band] || ["..."];
  return { band: b.band, meaning: b.meaning, phrase: list[Math.abs(seed) % list.length] };
}
function probOf(a) {
  if (!a || typeof a !== "object") return null;
  if (typeof a.noul === "number") return a.noul;
  if (typeof a.score === "number") return a.score > 1 ? a.score / 10 : a.score;
  const d = a.distribution || a.choice_distribution || a.probs;
  if (d && typeof d === "object") return Math.max(...Object.values(d).filter((x) => typeof x === "number"));
  return null;
}
async function jev(env, state, questions) {
  const t = Date.now();
  const r = await env.AI.run(MODEL, { state, questions });
  const res = r?.result?.answers ? r.result : r;
  return { ms: Date.now() - t, answers: res.answers || {}, usage: res.usage || null, model_version: res.version || res.model_version || null };
}
const rid = () => "m8-" + crypto.randomUUID().slice(0, 8);

// ---- telemetry: shared shape, D1-exact core + jev_* block, no content ----
async function tel(env, row) {
  if (!env.DB) return;
  try {
    await env.DB.prepare("INSERT INTO telemetry (ts,server,tool,ok,ms,receipt,jev_model,jev_contract,jev_questions,jev_ms,jev_in_tokens,jev_out_tokens,jev_band) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(new Date().toISOString(), "ma8ic-8all", row.tool, row.ok ? 1 : 0, row.ms, row.receipt, MODEL, row.contract || null, row.n || 0, row.jev_ms || null, row.usage?.prompt_tokens ?? row.usage?.input_tokens ?? null, row.usage?.completion_tokens ?? row.usage?.output_tokens ?? null, row.band || null).run();
  } catch (_) {}
}

// ---- tools ----
async function shake(env, { question, context = "" }) {
  if (!question) throw new Error("shake needs a question");
  const t = Date.now(); const receipt = rid();
  const state = `Question: ${question}\nContext: ${context || "(none given)"}`;
  const j = await jev(env, state, { ball: { type: "noul", instructions: question, criteria: C_MAGIC8.criteria } });
  const p = probOf(j.answers.ball);
  const ph = phraseOf(p ?? 0.5, C_MAGIC8, Math.floor((p ?? 0.5) * 1e6) + question.length);
  const out = { ...ph, probability: p, contract: `magic8@${C_MAGIC8.version}`, latency_ms: Date.now() - t, jev_ms: j.ms, receipt, advice_not_gate: true };
  await tel(env, { tool: "shake", ok: true, ms: out.latency_ms, receipt, contract: out.contract, n: 1, jev_ms: j.ms, usage: j.usage, band: ph.band });
  return out;
}

async function ask(env, { state, questions, contract, phrase = false }) {
  if (!contract || (typeof contract === "string" && !/@\d+/.test(contract)) || (typeof contract === "object" && !(contract.name && contract.version && contract.body)))
    return { refused: true, reason: "ask needs a contract as name@version (e.g. magic8@1) or {name, version, body}.", see: "call the docs tool, section 'How to write a contract'" };
  if (!state || !questions || typeof questions !== "object" || !Object.keys(questions).length)
    return { refused: true, reason: "ask needs a state string and a named map of typed questions.", see: "docs" };
  for (const [k, q] of Object.entries(questions)) {
    if (!TYPES.has(q?.type)) return { refused: true, reason: `question '${k}' has type '${q?.type}'; allowed: noul, score, choice`, see: "docs" };
    if (!q.criteria) return { refused: true, reason: `question '${k}' has no criteria; write them as full sentences`, see: "docs" };
  }
  let cname, cver, chash;
  if (typeof contract === "string") {
    [cname, cver] = contract.split("@");
    if (cname === "magic8" && cver === String(C_MAGIC8.version)) chash = await sha256(MAGIC8);
    else chash = null; // repo-path contracts are named by the caller; hash is the caller's
  } else { cname = contract.name; cver = String(contract.version); chash = await sha256(contract.body); }
  const t = Date.now(); const receipt = rid();
  const j = await jev(env, state, questions);
  const answers = {};
  for (const k of Object.keys(questions)) {
    const a = j.answers[k] ?? null; const p = probOf(a);
    answers[k] = { type: questions[k].type, answer: a, probability: p, ...(phrase && p != null ? phraseOf(p, C_MAGIC8, k.length + Math.floor(p * 1e6)) : {}) };
  }
  const out = { answers, contract: `${cname}@${cver}`, contract_sha256: chash, latency_ms: Date.now() - t, jev_ms: j.ms, usage: j.usage, receipt, advice_not_gate: true };
  await tel(env, { tool: "ask", ok: true, ms: out.latency_ms, receipt, contract: out.contract, n: Object.keys(questions).length, jev_ms: j.ms, usage: j.usage });
  return out;
}

function docs({ section } = {}) {
  if (!section) return { guide: DOCS, contract_magic8_v1: MAGIC8 };
  const re = new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?(?=^## |$(?![\\s\\S]))`, "mi");
  const m = re.exec(DOCS); return m ? { section: m[0] } : { sections: [...DOCS.matchAll(/^## (.*)$/gm)].map((x) => x[1]) };
}

async function telemetry(env) {
  if (!env.DB) return { shape: "D1-exact core (ts, server, tool, ok, ms, receipt) + jev_* block (model, contract, questions, ms, in/out tokens, band); no content", rows: null, note: "no DB binding on this deployment" };
  const r = await env.DB.prepare("SELECT tool, count(*) n, avg(ms) avg_ms, avg(jev_ms) avg_jev_ms, jev_band FROM telemetry GROUP BY tool, jev_band").all();
  return { shape: "D1-exact core + jev_* block, no content", rows: r.results };
}

const TOOLS = [
  { name: "shake", description: "Ask the ball a yes/no question. One Jev noul under contract magic8@1; returns the phrase AND the real probability, band, latency, receipt. Advice, not a gate.", inputSchema: { type: "object", properties: { question: { type: "string" }, context: { type: "string" } }, required: ["question"] } },
  { name: "ask", description: "Any Jev usage: one state, a named map of typed questions (noul/score/choice, criteria as full sentences), batched in one call. Requires contract name@version or {name,version,body}; refused otherwise. Returns every answer with its distribution, contract@version, latency, receipt. phrase:true adds the ball phrase.", inputSchema: { type: "object", properties: { state: { type: "string" }, questions: { type: "object" }, contract: {}, phrase: { type: "boolean" } }, required: ["state", "questions", "contract"] } },
  { name: "docs", description: "How to use Jev well: bands, writing a contract, batching, reading confidence as advice, worked examples. Optional section.", inputSchema: { type: "object", properties: { section: { type: "string" } } } },
  { name: "telemetry", description: "Aggregate usage in the shared telemetry shape (jev_* block). No content is ever stored.", inputSchema: { type: "object", properties: {} } },
];

async function rpc(env, msg) {
  const { id, method, params } = msg;
  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  if (method === "initialize") return ok({ protocolVersion: params?.protocolVersion || "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "ma8ic-8all", version: "0.1.0" } });
  if (method === "notifications/initialized") return null;
  if (method === "ping") return ok({});
  if (method === "tools/list") return ok({ tools: TOOLS });
  if (method === "tools/call") {
    const a = params?.arguments || {};
    try {
      const r = params.name === "shake" ? await shake(env, a) : params.name === "ask" ? await ask(env, a) : params.name === "docs" ? docs(a) : params.name === "telemetry" ? await telemetry(env) : null;
      if (r === null) return { jsonrpc: "2.0", id, error: { code: -32602, message: "unknown tool" } };
      return ok({ content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r, isError: !!r.refused });
    } catch (e) {
      await tel(env, { tool: params.name, ok: false, ms: 0, receipt: rid() });
      return ok({ content: [{ type: "text", text: String(e.message || e) }], isError: true });
    }
  }
  return { jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } };
}

function authed(req, env) {
  const h = req.headers.get("authorization") || "";
  return !!env.MA8IC_TOKEN && h === `Bearer ${env.MA8IC_TOKEN}`;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/health") return Response.json({ ok: true, server: "ma8ic-8all", contract: `magic8@${C_MAGIC8.version}` });
    if (u.pathname !== "/mcp") return new Response("not found", { status: 404 });
    if (!authed(req, env)) return new Response("unauthorized", { status: 401, headers: { "www-authenticate": "Bearer" } });
    if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
    const body = await req.json();
    if (Array.isArray(body)) { const r = (await Promise.all(body.map((m) => rpc(env, m)))).filter(Boolean); return Response.json(r); }
    const r = await rpc(env, body);
    return r ? Response.json(r) : new Response(null, { status: 202 });
  },
};
