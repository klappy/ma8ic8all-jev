# 🎱✨ Ma8ic 8all

Ask the ball, get a real answer. A Jev MCP service (Cloudflare Worker `ma8ic-8all`, Workers AI binding to `typesafe/jev`). The costume is a joke; the probabilities are not.

Tools: `shake`, `ask`, `docs`, `telemetry`. Contract: `contracts/CONTRACT-magic8@1.md`. Guide: `docs/GUIDE.md`.

## Endpoints
- `POST /mcp` — MCP JSON-RPC (`initialize`, `tools/list`, `tools/call`).
- `POST /v1/{tool}` — plain JSON API over the same handlers: body is the tool's arguments, response is the tool's result (`shake`, `ask`, `docs`, `telemetry`). `GET /v1/docs` also works.
- `GET /health` — open; name + contract version, no data.

## Auth (no secret to manage)
The Worker sits behind **Cloudflare Access** (team `klappy.cloudflareaccess.com`). People sign in with their email; seats use an Access service token (`CF-Access-Client-Id` / `CF-Access-Client-Secret` headers). The Worker then verifies the `Cf-Access-Jwt-Assertion` JWT itself (RS256 against the team certs, `aud` = `ACCESS_AUD`, `iss`, `exp`) and **fails closed**: missing vars or a bad token = 403. Borrowed from `klappy/prs` `src/auth.ts`. The central account-broker OAuth is the next slice; there is no `MA8IC_TOKEN`.

Deploy: git push via Workers Builds (branch `staging` = preview version; `main` = production, captain-ruled only). No hand `wrangler deploy`.
