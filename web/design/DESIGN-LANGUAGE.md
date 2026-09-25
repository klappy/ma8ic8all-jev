# Ma8ic 8all web — Design language (slice 1)

Design mode first, code second (best practice 3). These tokens and rules are what the mockups in `mockups/` use; implementation copies them, not the other way round.

## The idea in one line
**A toy on the outside, a lab instrument on the inside.** The ball, the die and the phrase are the costume. The probability, contract and receipt are the instrument, and they are never more than one tap away.

## Principles
1. **Costume, then truth, one tap apart.** Every phrase has a "why" beside it. No screen shows a phrase alone.
2. **Numbers are advice, not verdicts.** Show p with its band lines and a near-tie mark (±0.05), never a bare "YES".
3. **Hazy is a first-class answer.** It gets its own color and copy, and it says what context would help. It is never styled as an error.
4. **One call, many questions.** The builder's primary button counts questions and says "in 1 call".
5. **Consent is visible, every time.** The receipt footer (id · what is kept · expunge · feedback · pay) is fixed and identical on every result.
6. **Delight is short and skippable.** Animation ≤ 1.2 s and never longer than the real call; `prefers-reduced-motion` gets a fade. Sound is off by default.
7. **Web and agent see the same thing.** Any result can be copied as the exact MCP call and JSON answer.
8. **Honest copy.** Public copy uses the settled line: "We're deploying Jev across our entire ontology, one proven decision at a time — opt-in until the experiments say it's better. Here's how to do the same." Claims cite the experiments registry; open claims (C29) are labelled open. Mock numbers in the mockups are labelled as mock.

## Color tokens
| token | value | use |
|---|---|---|
| `--ink` | `#0b0b14` | page background (night) |
| `--ink-2` | `#151526` | panels |
| `--line` | `#2a2a40` | borders, band lines |
| `--text` | `#ecebf5` | primary text |
| `--muted` | `#9a98b3` | secondary text |
| `--die` | `#2b2fd0` → `#1a1c8a` | triangle die (gradient), the only saturated blue |
| `--yes` | `#3ecf8e` | yes band (p ≥ 0.80) |
| `--hazy` | `#b9b4d6` | hazy band (0.35–0.80), fog lilac, never grey-disabled |
| `--no` | `#ef6a5a` | no band (p < 0.35) |
| `--accent` | `#ffd166` | focus rings, the "why?" link, primary actions |

Band thresholds are read from the contract (`magic8@1`: 0.80 / 0.35), never hard-coded in UI copy. Contrast: all text tokens on `--ink`/`--ink-2` pass WCAG AA; band colors are always paired with a word (yes / hazy / no), never color alone.

## Type
- UI: system stack (`ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`). Headline 28/32 bold, body 16/24, small 13/18.
- Die phrase: 17–20 px, uppercase-free, centered, max 3 lines, set inside the triangle.
- Instrument: `ui-monospace, SFMono-Regular, Menlo, monospace` for p values, receipt ids, contract@version, sha, JSON.
- Numbers: p with two decimals (`0.83`); latency in ms, integer.

## Shapes and components
- **Ball:** a 280 px (mobile) black sphere with a radial highlight; a dark circular window; the die is an equilateral triangle, point-down, in `--die`, with the phrase in white.
- **Band bar:** 0–1 track, lines at the contract's band edges, a marker at p, the zone label under it; near-tie shading ±0.05 around each line.
- **Receipt chip:** mono, `rcpt_…`, copy-on-tap.
- **Step list (shake reveal):** 1 · routed to `contract@v` (routing confidence) → 2 · answered (p). Both steps always shown (EPIC k0099).
- **Distribution card (ask):** question name, type badge, horizontal bars per option (choice) or band bar (noul/score), top pick bolded.
- **Receipt footer:** a fixed 3-action row: Keep (default) · Swap for feedback · Expunge, plus "or pay: nothing kept". Terms link.
- **Consent sheet:** bottom sheet on first call; one primary "I understand, shake" and a link to terms.
- **Account slot:** a nav item "Usage & plan" rendered disabled with "later". Nothing behind it.

## Motion
- Shake: 5 decaying horizontal oscillations with slight rotation, 900 ms, `cubic-bezier(.36,.07,.19,.97)`.
- Die surfacing: window goes from opaque to translucent over 400 ms while the die scales 0.6 → 1 and rotates −12° → 0°, slight blur 4 px → 0.
- Why reveal: panel slides up 240 ms.
- Reduced motion: all of the above become a 200 ms crossfade.
- Phones: tap to shake. Device-motion shake is an open question (needs an iOS permission prompt).

## Sound
Off by default, a speaker toggle in the corner remembers the choice locally. The only sound is one soft low "slosh" on shake. No sound on results.

## Voice
Plain, short, a little playful on the costume and dry on the instrument. The ball may say "The liquid is swirling." The reveal says "p = 0.52, hazy band (0.35–0.80). Gather more evidence." Never cute in errors: "The call failed. No answer was made up."
