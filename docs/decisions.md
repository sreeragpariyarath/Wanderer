# Decisions

A log of the significant choices made while setting up deployment and CI/CD, why they were made, and what they cost. Newest decisions go at the bottom. If a decision is reversed, add a new entry rather than editing the old one, and mark the old one as superseded.

Each entry lists who decided: **Owner** means the repository owner chose it, **Proposed** means it was proposed during setup and accepted.

Status values: **Accepted**, **Temporary** (has a stated exit condition), **Pending** (waiting on something external), **Superseded**.

## 1. Ship the app as a static export

- **Status:** Accepted. **Decided by:** Proposed.
- **Context:** The app is client-side only: one page, no API routes, no server actions, no `next/image`. The only Next.js feature in use is `next/font/local`.
- **Decision:** Set `output: 'export'` and serve `out/` as plain files.
- **Why:** Plain files can be hosted on the free tier of any static host, with no server runtime, cold starts, or adapter to maintain.
- **Consequences:** Server-only features (route handlers, server actions, middleware, image optimization) are unavailable. Adding any of them means revisiting hosting.
- **Alternatives:** Running `next start` on a Node host, or a Cloudflare adapter for Next.js. Both add moving parts the site does not need.

## 2. Host on Cloudflare Pages, not Workers

- **Status:** Accepted. **Decided by:** Owner.
- **Context:** The goal is a reliable, reproducible, zero-cost deployment.
- **Decision:** Use Cloudflare Pages (free plan) and `wrangler pages deploy`. Do not use Workers or `wrangler deploy` unless a technical requirement appears.
- **Why:** The site is static, so a Pages project is the simplest fit and costs nothing.
- **Consequences:** `wrangler.jsonc` configures a Pages project (`pages_build_output_dir`). Pages features such as Functions are not used.
- **Alternatives:** Workers static assets (my first draft used this, and it was replaced), GitHub Pages, Vercel.

## 3. Deploy by direct upload from GitHub Actions

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** CI builds and tests the site, then uploads that exact `out/` artifact to Pages. The repository is not connected to Cloudflare's own Git builds.
- **Why:** What was tested is exactly what ships, and there is one deployment path instead of two.
- **Consequences:** Deploys need the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets. Connecting the repo to Cloudflare Git builds later would cause duplicate deploys.

## 4. Pages project name is `sreerag`

- **Status:** Accepted. **Decided by:** Owner.
- **Context:** The earlier working name contained "wanderer", which the owner did not want.
- **Decision:** Name the Pages project `sreerag` (`sreerag.pages.dev`), and rename the npm package to `sreerag` as well. The repository name and in-app text are unchanged.
- **Consequences:** The name appears in `wrangler.jsonc`, `deploy.yml`, and the `deploy` script. The deploy workflow fails if `wrangler.jsonc` and the workflow disagree.

## 5. One required status check: `CI gate`

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** A final `CI gate` job depends on every other CI job, and branch protection requires only that check.
- **Why:** Renaming, splitting, or adding CI jobs never breaks the protection rules, because the rule points at one stable name.
- **Consequences:** If a new job is added, it must also be listed in the gate's `needs`, or it will not block merges.

## 6. Run e2e tests against the exported site through the Pages runtime

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** In CI, Playwright serves `out/` with `wrangler pages dev`. Locally it still uses the dev server.
- **Why:** This tests what ships, including `public/_headers`. A plain static server such as `serve` ignores `_headers`, so a CSP that broke the app would not have been caught.
- **Consequences:** CI downloads the built artifact and depends on `wrangler`. Local runs and CI use different servers.

## 7. Pin actions to commit SHAs, use least privilege

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** Every third-party action is pinned to a full commit SHA (with the version in a comment). Workflows default to `contents: read`, and elevate only where needed (for example CodeQL's `security-events: write`).
- **Why:** A tag can be moved to malicious code; a SHA cannot. Narrow permissions limit damage if a workflow is compromised.
- **Consequences:** Updates arrive through Dependabot PRs, which must be reviewed.

## 8. Node version comes from `.nvmrc`

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** `.nvmrc` pins Node 24, matching local development, and `package.json` declares `engines: >=22`. CI reads `.nvmrc`.
- **Why:** One source of truth for CI and local setups. My first draft hard-coded Node 22 with no basis.

## 9. Client JavaScript budget of 1.2 MB

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** The build job fails if the raw size of all client JS under `out/_next/static` exceeds 1,200,000 bytes. It is about 0.88 MB today.
- **Why:** Gives some headroom while making accidental bloat visible in review.
- **Consequences:** It is a blunt, raw-byte limit. Raise it deliberately when the app legitimately grows.

## 10. Restrictive headers, with `unsafe-inline` for scripts and styles

- **Status:** Accepted, with a known weakness. **Decided by:** Proposed.
- **Decision:** `public/_headers` sets a CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. The CSP allows `'unsafe-inline'` for scripts and styles.
- **Why:** The exported pages include Next.js inline bootstrap scripts, and animated overlay styles are applied inline. Blocking them would break the app.
- **Consequences:** This weakens the CSP's protection against injected scripts. A tighter policy would need hashes or nonces, which a static export makes awkward. Anything added from other hosts (scripts, fonts, media) must be added to the CSP.

## 11. `npm audit` blocks on critical only (temporary)

- **Status:** Temporary. **Decided by:** Owner, on my recommendation.
- **Context:** A high-severity finding exists in PostCSS (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849), bundled inside Next.js 15. It runs only at build time on this repository's own CSS, and the site ships as static files, so it is not reachable in production. The only fix is Next.js 16.
- **Decision:** The audit gate fails on critical findings only, and reports high findings without failing.
- **Exit condition:** When upgrading Next.js, tighten the gate to `--audit-level=high`.
- **Consequence:** Until then, a new high-severity production vulnerability would not block merging.

## 12. Ignore major TypeScript updates in Dependabot (temporary)

- **Status:** Temporary. **Decided by:** Proposed.
- **Context:** Dependabot proposed TypeScript 5.9 to 7.0.2. `npm ci` failed because `typescript-eslint` does not support TypeScript 7 yet.
- **Decision:** Ignore semver-major TypeScript updates. Minor and patch updates still come through.
- **Exit condition:** Remove the ignore rule once `typescript-eslint` supports the new major version.

## 13. Branch ruleset: pull requests required, zero approvals, no bypass

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** Ruleset `protect-main` requires a pull request and a passing `CI gate`, blocks force pushes and deletion, and requires 0 approvals. The bypass list is empty.
- **Why:** The repository has one maintainer, and GitHub does not allow approving your own PR, so requiring an approval would block all merges. The empty bypass list means the rules apply to the owner too.
- **Consequences:** No direct pushes to `main`, even in an emergency, unless the owner edits the ruleset. If more contributors join, raise the approval count.

## 14. Least-privilege and separate Cloudflare credentials

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** The GitHub deploy token has one permission only (account, Cloudflare Pages, Edit), stored as an environment secret in the `production` environment. For adding the custom domain, use a separate short-lived token and delete it afterwards, and send the API call directly rather than through the third-party form at `cf-pages.is-a.dev`.
- **Why:** The form relays a token through an external proxy that cannot be audited from here. A token with Pages Edit can modify the project.
- **Consequences:** A few more manual steps when adding the domain.

## 15. Do not build per-pull-request preview deployments yet

- **Status:** Accepted for now. **Decided by:** Proposed.
- **Context:** My first draft included PR previews. I could not verify how Cloudflare reports preview URLs from the CLI, and a guess could have broken the pipeline.
- **Decision:** Only `main` is published.
- **Consequences:** Visual changes are checked in e2e and locally, not on a live preview. Pages supports branch previews, so this can be added later once the behavior is verified.

## 16. Use an is-a.dev subdomain for the public URL

- **Status:** Pending (PR open). **Decided by:** Owner.
- **Decision:** Register `sreerag.is-a.dev` through a pull request to the `is-a-dev/register` repository (#57365), pointing a CNAME at `sreerag.pages.dev`. Add the domain to the Pages project through the Cloudflare API, because the dashboard cannot add is-a.dev names (the service is on the Public Suffix List).
- **Why:** It is free and suits a developer portfolio.
- **Consequences:** Approval is manual and can take up to a few days. The service has rules: software-development related, non-commercial, no pinging maintainers. The domain is not under our control, so it can be revoked if rules are broken.
- **Sequencing rule:** Set the `SITE_URL` repository variable only after `https://sreerag.is-a.dev` actually loads. The deploy smoke test checks that URL, so setting it early would fail every deploy.

## 17. Force LF line endings

- **Status:** Accepted. **Decided by:** Proposed.
- **Decision:** `.gitattributes` sets `* text=auto eol=lf`.
- **Why:** The repository was already stored with LF, but Windows checkouts convert to CRLF, which made `prettier --check` fail on files nobody had edited. CI runs on Linux and was unaffected, so this mainly stops local noise.
