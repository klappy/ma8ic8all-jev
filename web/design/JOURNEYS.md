# Ma8ic 8all web — Journeys (slice 1, design mode)

Epic: `klappy/kitchen rail/2-cooking/2026-09-25-ma8ic8all-web-epic/EPIC.md` (code name `ma8ic8all-web`). Status: **design for the captain's look. No app code.** The backend (`shake` · `ask` · `docs` · `receipts`, Otto's unit) stays unchanged under this; the web app is a client of the same MCP tools.

Best practice 1 applies here: start from who uses it and what they are trying to do, then screens. Each journey below lists the goal, the path, what the moment must feel like, how it can fail, and which mockup covers it.

The rule that runs through all three (best practice 8): **the phrase is the costume, and the probability and receipt are always one tap away.** No screen shows a phrase without a "why" affordance beside it.

---

## J1 — The curious shaker

**Who.** Someone who heard about the gag. They may not know what Jev is and have no contract. They have a question that is bugging them.
**Goal.** Get an answer that is fun, then find out it was real.
**Tool.** `shake(question, context?)` (zero-config: the ball routes to a contract from our library itself, per EPIC k0099).

| # | Step | What they see / do | Must feel like |
|---|---|---|---|
| 1 | Arrive | The ball, a single question field, one line: "Ask the ball. Get a real answer." | A toy, not a form. |
| 2 | First-call consent | Before the first shake, a sheet: free tier means you pay with your (filtered) request data; two other ways to pay; link to terms. Must acknowledge. Never implied (EPIC k0101). | Honest and short. One tap. |
| 3 | Ask | Types the question. An optional "add context" drawer: "The ball only judges what you tell it." | Inviting, not homework. |
| 4 | Shake | Tap (or shake the phone). The ball wobbles, the window darkens, the triangle die rises through the liquid. Sound is **off** by default. | Delight. About 1 s, never longer than the real call. |
| 5 | Phrase | The die shows the phrase, tinted by band (yes / hazy / no). A small "why?" sits under it. | The joke lands. |
| 6 | Why | One tap opens the reveal: the probability on a 0–1 bar with the band lines (0.35 / 0.80 from `magic8@1`); the two steps: **routed to** contract@version with routing confidence, then **answered** with p; latency; receipt id. | "Wait, this is real." |
| 7 | Hazy on purpose | If routing or the answer is unsure, the die says so and the reveal lists what context would help. | Trustworthy, not broken. |
| 8 | Footer | Every result carries the fixed footer: receipt id · what is kept · expunge · swap for feedback · pay (EPIC k0104/k0106). | Choice, not fine print. |
| 9 | Next | Shake again, or "ask this properly" which carries the question into the builder (J2). | A door to the real product. |

**Failure states.** No network or refused call → the ball "clouds over", says so plainly, no fake phrase. Rate-limited → says when to retry. A near-tie (p within about ±0.05 of a band line, per the speed receipt) → the reveal marks it "near the line; treat as a tie".
**Mockup.** `mockups/shake.html` (states: consent, idle, shaking, yes, hazy, no, error; toggle sound).

---

## J2 — The builder writing a contract and calling `ask`

**Who.** A developer or an agent's operator who wants Jev as a typed decision layer in their own system.
**Goal.** Write (or pick) a contract, ask several typed questions about one state in **one batched call**, read the distributions, and copy the exact call into their code.
**Tools.** `ask(state, questions, contract, phrase?)`, `docs`.

| # | Step | What they see / do | Must feel like |
|---|---|---|---|
| 1 | Pick a contract | Contract picker: public examples (`magic8@1`) and "bring your own": paste a body with name and version; the builder shows the sha256 that will go in the receipt. No contract → the Ask button stays disabled with a pointer to the docs, mirroring the backend refusal. | Contracts are files, versioned (best practice 8). |
| 2 | Write the state | One state box: "Everything Jev may judge. It looks nothing up." | Clear boundary. |
| 3 | Add questions | Rows: name · type (`noul` / `score` / `choice`) · criteria as full sentences · options for `choice`, with an escape option ("reply hazy" / "none") suggested by default. Inline lint: missing criteria, one-word criteria, no escape. | A good contract is the easy path. |
| 4 | Ask | One button, labelled with the count: "Ask 4 questions in 1 call". | Batching is the default, not an option (speed receipt: model time flat from 1 to 14 questions). |
| 5 | Read results | A card per question: full distribution, top pick, band chip, near-tie mark. Optional phrase per answer (`phrase: true`). Batch header: contract@version, sha, latency, jev_ms, receipt. | Numbers first; the phrase is a toggle. |
| 6 | Take it home | "Copy as MCP call" / "Copy as JSON" shows the exact `ask` payload. | Web and agent see the same call. |
| 7 | Iterate | Edit the contract → the version field nags "text changed, bump the version?". Re-run keeps the prior results beside the new ones. | Iterating versions is the method (guide). |
| 8 | Learn | `docs` is a side panel, not a separate site: bands, how to write a contract, batching, worked examples, what is not proven (C29 open). | The product is Jev plus the guides (EPIC k0090). |

**Failure states.** Backend refusal (bad type, no criteria, no contract) shows the backend's own reason text verbatim plus the docs section it points to. A partial answer shape → the card says "answer shape not recognized" rather than inventing a bar.
**Mockup.** `mockups/ask.html`.

---

## J3 — The operator reading receipts and telemetry

**Who.** Whoever runs a system that calls Ma8ic 8all (or the captain looking at the service itself).
**Goal.** Find a call by receipt id, see what happened and what was kept, act on the retention choice, and see the aggregate health without any content.
**Tool.** `receipts` (read receipts + telemetry, expunge, feedback; replaces a separate `telemetry` tool per EPIC k0104).

| # | Step | What they see / do | Must feel like |
|---|---|---|---|
| 1 | Land | A telemetry strip: calls per tool, median latency, jev_ms, band mix, tokens. Telemetry has **no content** (shared shape). | A dashboard you trust at a glance. |
| 2 | Find | Receipt list, newest first; search by receipt id; filter by tool, contract, band, retention. | Fast lookup by id. |
| 3 | Inspect | Receipt detail: tool, routed contract@version + routing confidence (shake), contract sha (ask), probabilities, latency split, token counts, redaction counts ("3 sentences redacted: 2 pattern, 1 Jev at 0.34"), retention state. | Everything but the content. |
| 4 | Choose retention | The same three ways to pay, as actions: keep (default, filtered), **swap for feedback** (form asks what they were trying to do, whether it helped, what was missing; Jev `feedback-valid@1` verdict shown: fake/generic · thin · meaningful, with the reason if not meaningful), **expunge** (confirm; removes the record and derived rows), or upgrade to paid (nothing kept). | Consent you can act on by id. |
| 5 | Account room | A disabled "Usage & plan" tab marks where metering on `jev_*` rows will live. **Not built** (EPIC: later, not ordered). | Room, not a promise. |

**Failure states.** Expunged receipt → a tombstone row ("expunged at …", no fields). Feedback judged thin → record stays under "pay with data", and the UI says why and offers retry or pay; never a service refusal.
**Mockup.** `mockups/receipts.html`.

---

## Open questions (for the captain; none block slice 1)

1. **Repo home for the app.** Own repo `klappy/ma8ic8all-web`, or `web/` inside `klappy/ma8ic8all-jev` (where these files sit now), or other. See kitchen `ASK.md` beside the epic, hold `hold-m8web-repo-home`.
2. **Who is the web app's first audience?** Public shakers (needs the consent sheet and terms first), or builders only (the ask builder is the front door and shake is the demo).
3. **Auth for the web client.** The backend is bearer-only today (`MA8IC_TOKEN`). A public web shake needs either an anonymous free-tier caller id or a sign-in. Which one, and does the consent acknowledgement bind to that id?
4. **Phone shake gesture.** Use device motion to trigger a shake on phones (needs a permission prompt on iOS), or tap only?
5. **Sound.** Off by default is settled. Is there a sound at all in slice 2 (one soft "slosh"), or none?
6. **Contract library visibility in the picker.** EPIC k0099 says library bodies are the secret sauce and receipts name only contract@version. May the `ask` picker list library contract names as choices (bodies hidden), or only public examples plus bring-your-own?
7. **Tool name drift.** EPIC k0104 folds `telemetry` into `receipts`; Otto's `staging` still ships `telemetry`. The mockups follow the EPIC (`receipts`). Confirm that the backend follows.
8. **Terms copy.** The consent sheet and footer use placeholder wording until the captain's and a lawyer's read (EPIC k0104).
