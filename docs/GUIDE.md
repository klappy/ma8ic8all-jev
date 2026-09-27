# Ma8ic 8all guide: how any model can use Jev properly

We're deploying Jev across our entire ontology, one proven decision at a time — opt-in until the experiments say it's better. Here's how to do the same.

Off by default is the method, not a gap: each seam opts in only after a graded experiment shows it helps, and is reversed when it does not. Seeded from `klappy://docs/guides/jev-in-the-odd-stack`; every claim below cites the experiments registry (`klappy/kitchen rail/3-pass/2026-09-25-experiments-registry`, EXPERIMENTS.tsv / CLAIMS.tsv) or a plated receipt.

## Always pass context
**Rule: every `shake` and every `ask` carries context** — what is known, the numbers, the time left, who is acting. Jev judges only what is in state. Without context the ball returns the model's blind prior, and the response says so: `"context":"none"` plus a `note` pointing here.

Worked pair (door, 2026-09-26 ~22:30 ET, question "Will we merge 80 PRs by midnight?"):
- Blind — `shake({question})` → **no, 0.08**. The model's prior about merging 80 PRs, nothing more.
- With rail context — `shake({question, context: "<PRs merged so far tonight, PRs open and green, cooks active, minutes to midnight, who merges>"})` → **hazy, 0.64**.
Same question, same model; the context moved the answer from a confident no to "gather more evidence". The blind answer was not wrong about the world — it was not about the world at all.

Good context is a short paragraph: counts, rates, deadline, blockers, who acts. Under ~80 characters is treated as none.

## What Jev is
A small typed decision model (`typesafe/jev` on Workers AI). You give it one state and named questions; each question is `noul` (probability that a claim is true), `score`, or `choice`. It judges only what is in state.

## How to write a contract
A contract is a file with a name and version: what state must hold, the criteria for each answer as full sentences, the bands, an escape hatch (what to do when state cannot support an answer), and worked examples. `ask` refuses without `name@version`; an inline contract `{name, version, body}` is hashed into the receipt. Change the text → bump the version.

## The bands
From `CONTRACT-magic8@1`: p ≥ 0.80 yes, 0.35–0.80 hazy (gather more evidence or ask the captain), < 0.35 no. The thresholds live in the contract, so a new version can move them without a code change.

## Reading confidence as advice
The number is advice, not a gate. The seat acts on it and owns the call. The phrase is costume. Nouls moved about ±0.05 between identical reruns, so treat near-ties as ties (receipt: `rail/4-plated/2026-09-25-jev-speed-bottlenecks/VERDICT.md`).

## Batching
Put every candidate for one situation into one call as a named map of questions. Measured: about 290 ms of model time whether a call asks 1 question or 14; batched top-1 9/12 vs per-question 6/12 on the offload set, n=12, one run — a signal, not a verdict (same receipt as above).

## Worked examples
- Gag: `shake("Should I ship today?", "CI green; captain approved")`.
- Offload check (noul per candidate): state = situation + candidates; question per candidate "Does candidate [n] govern what the seat should do here?"
- Canon qualify (noul): "Does this document state a rule that applies to this situation?"
- Sentence map (choice): which section a sentence belongs in, with "none" as the escape hatch.
- Decide (choice): pick among options, including "reply hazy".

## What is not proven yet
Whether Jev's advice improves an LLM's own answers is open (registry C29). The Workers AI binding path's latency was unmeasured until this service.
