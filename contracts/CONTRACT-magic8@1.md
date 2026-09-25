---
contract: magic8
version: 1
used_by: shake (always), ask (when the caller names magic8@1)
---
# CONTRACT magic8@1

The ball is a costume over one Jev `noul`. The number is the advice; the phrase is decoration.

## What the context must hold
- `question`: one yes/no question, phrased so "yes" has a clear meaning.
- `context`: the facts the asker already has. Jev judges only what is in state; it does not look anything up.
- Escape hatch: if the context cannot support either answer, Jev should land in the hazy band, not guess.

## Criteria (sent to Jev verbatim)
- true: The context gives clear support for answering yes to the question as asked.
- false: The context points to no, or does not hold enough to say yes with confidence.

## Bands (thresholds live here, not in code)
| band | min | max | meaning |
|---|---|---|---|
| yes | 0.80 | 1.00 | act on it, still your call |
| hazy | 0.35 | 0.80 | gather more evidence or ask the captain |
| no | 0.00 | 0.35 | do not act on it as asked |

## Phrases
### yes
- The ball has spoken, and it is leaning hard your way.
- Green light from the depths of the ball.
- Every bubble in here points to yes.
- The dice inside agree: go.
- Strong odds on your side.
- That one comes up yes.
- Looks solid from in here.
- Yes, and the number backs it up.
- The fog clears: yes.
- Count on it, but read the number.
### hazy
- The liquid is swirling. Gather more evidence.
- Too murky to call. Ask the captain.
- Half a yes is not a yes. Look again.
- The ball wants more context before it commits.
- Shake again after you learn something new.
### no
- The ball sinks toward no.
- Not with what you have told it.
- Odds are against this one.
- The window reads no.
- Do not bank on it.

## Examples
- question "Should we ship the patch today?", context "CI green on the head sha; captain approved; no open blockers." → expect yes band.
- question "Will it rain on the launch?", context "" → expect hazy band (no evidence; escape hatch).
