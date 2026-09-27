import { readFileSync } from "node:fs";
import assert from "node:assert";
const src = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const DOCS = readFileSync(new URL("../docs/GUIDE.md", import.meta.url), "utf8");
const cut = (a, b) => src.slice(src.indexOf(a), src.indexOf(b)).replace(/export /g, "");
const flagSrc = cut("export const MIN_CONTEXT", "async function shake");
const docsSrc = cut("export const DOC_TOPICS", "async function telemetry");
const { contextFlag, docs } = new Function("DOCS", "MAGIC8", flagSrc + docsSrc + "; return { contextFlag, docs };")(DOCS, "magic8");
// 2: blind flag, not an error
assert.equal(contextFlag(undefined).context, "none");
assert.equal(contextFlag("CI green").context, "none");
assert.match(contextFlag("").note, /blind prior — pass context/);
assert.equal(contextFlag("x".repeat(80)), null);
// 1: shake description leads with the rule
const shakeDesc = /name: "shake", description: "([^"]*)"/.exec(src)[1];
assert.ok(shakeDesc.startsWith("ALWAYS pass `context`"), shakeDesc);
assert.match(shakeDesc, /0\.08/); assert.match(shakeDesc, /0\.64/);
// 3: docs leads with the rule and the worked pair; topics
const all = docs();
assert.match(all.rule, /^Always pass context/);
assert.deepEqual(all.topics, ["context", "contract", "bands", "batching"]);
const secs = [...DOCS.matchAll(/^## (.*)$/gm)].map((x) => x[1]);
assert.equal(secs[0], "Always pass context");
assert.ok(secs.indexOf("How to write a contract") < secs.indexOf("The bands") && secs.indexOf("The bands") < secs.indexOf("Batching"));
const ctx = docs({ topic: "context" }).section;
assert.match(ctx, /Will we merge 80 PRs by midnight\?/); assert.match(ctx, /no, 0\.08/); assert.match(ctx, /hazy, 0\.64/);
for (const [t, h] of [["bands", "## The bands"], ["batching", "## Batching"], ["contract", "## How to write a contract"]]) assert.ok(docs({ topic: t }).section.startsWith(h), t);
assert.ok(docs({ section: "Batching" }).section.startsWith("## Batching"));
assert.ok(docs({ topic: "nope" }).topics);
console.log("docs guidance ok (context flag, shake description, docs topics, worked pair first)");
