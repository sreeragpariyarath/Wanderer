# Deployment and CI/CD

This document records how Wanderer is built, tested, hosted, and published, and what is still pending. It describes the setup as of 2026-10-19.
The reasoning behind each choice is in [decisions.md](decisions.md).

> **Status (2026-10-22):** automatic deploys from this repository are switched off. The Cloudflare Pages project `sreerag` (`sreerag.pages.dev`) now serves the portfolio from the `sreeragpariyarath/portfolio` repository, so a deploy from here would overwrite it. `deploy.yml` can still be run by hand, but only with a confirmation phrase. The sections below describe the pipeline as it was built for Wanderer; see [decisions.md](decisions.md) entry 18.

## At a glance

| Item                 | Value                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| Source               | `https://github.com/sreeragpariyarath/Wanderer`, branch `main`                  |
| Build output         | Static export (`output: 'export'`) in `out/`                                    |
| Hosting              | Cloudflare Pages (free plan), project `sreerag`                                 |
| Temporary URL        | `https://sreerag.pages.dev` (live)                                              |
| Planned public URL   | `https://sreerag.is-a.dev` (pending approval, see below)                        |
| Deploy trigger       | Every push to `main`, after CI passes                                           |
| Required merge check | `CI gate`                                                                       |
| Cost                 | Free: GitHub Actions, Cloudflare Pages, and the is-a.dev subdomain are all free |

```
GitHub (Wanderer) -> GitHub Actions (CI) -> Cloudflare Pages -> sreerag.pages.dev -> sreerag.is-a.dev
```

## Why a static export

The app is entirely client-side: one page, no API routes, no server actions, and no `next/image`. Exporting it to plain files means Cloudflare Pages only serves files. There is no server runtime, no cold start, and no adapter to maintain. Do not add server-only Next.js features (route handlers, server actions, middleware, image optimization) without revisiting the hosting choice.

## Hosting: Cloudflare Pages

- Project name: `sreerag` (set in `wrangler.jsonc` and `.github/workflows/deploy.yml`; the workflow fails if they differ).
- Pages is used in direct-upload mode: GitHub Actions builds and tests the site, then uploads the exact `out/` that CI produced with `wrangler pages deploy`. Do not also connect the repository to Cloudflare's own Git builds, or every push would deploy twice.
- `public/_headers` is copied into `out/` and applied by Pages. It sets a Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and immutable caching for `/_next/static/*`. If you add third-party scripts, fonts, or media hosts, update the CSP there.
- `npm run preview` serves `out/` locally through the Pages runtime with the same headers.

## GitHub Actions workflows

All workflows pin third-party actions to full commit SHAs and use least-privilege `permissions`. Dependabot keeps the pins current.

### `ci.yml` (pull requests, and called by the deploy workflow)

- Typecheck, lint, and Prettier format check.
- Unit tests (Vitest).
- Production build, plus a client JavaScript budget (1.2 MB raw; about 0.88 MB today).
- Playwright e2e for the `desktop` and `mobile` projects, run against the exported `out/` served by the Pages runtime, so headers are tested too.
- `CI gate`: one final job that fails unless every job above succeeded. This is the only check that branch protection requires.

### `security.yml` (pull requests, pushes to `main`, weekly)

- `npm audit` on production dependencies (blocks on critical only; see Known exceptions).
- CodeQL analysis for JavaScript and TypeScript.
- Dependency review on pull requests (needs GitHub's dependency graph enabled, which it is).

### `deploy.yml` (pushes to `main` and manual dispatch)

1. Re-runs the full CI workflow.
2. Downloads the `out/` artifact that CI built, so what was tested is what ships.
3. Publishes it with `wrangler pages deploy out --project-name sreerag --branch main`.
4. Smoke-tests the unique deployment URL and the production URL: HTTP 200, a title, the CSP and `X-Frame-Options` headers, and a hashed JS asset served with immutable caching. Any failure fails the workflow.
5. Only one production deployment runs at a time. A queued deploy waits rather than cancelling one in progress.

Secrets live in the GitHub `production` environment: `CLOUDFLARE_API_TOKEN` (permission: account, Cloudflare Pages, Edit only) and `CLOUDFLARE_ACCOUNT_ID`. Set the repository variable `SITE_URL` to the final domain once it works (see below); until then the smoke test uses `https://sreerag.pages.dev`.

### Dependabot

`.github/dependabot.yml` opens weekly update PRs for npm and for GitHub Actions, grouped by area (framework, testing, lint and format, Cloudflare). Major TypeScript updates are ignored until `typescript-eslint` supports TypeScript 7.

## Branch protection

A ruleset named `protect-main` is active on `main`:

- Changes must go through a pull request (0 approvals required, since this is a solo repository).
- The `CI gate` check must pass before merging.
- Force pushes and branch deletion are blocked.

Nothing reaches production without passing CI, because merging to `main` is what deploys.

## How to ship a change

1. Create a branch and open a pull request.
2. Wait for CI. Fix anything red.
3. Merge. The deploy workflow runs and publishes automatically.
4. Check the Actions tab. A green Deploy run means the live site passed its smoke test.

To redeploy without a code change, run the `Deploy` workflow manually from the Actions tab. To roll back, revert the pull request on GitHub (which deploys the previous code), or promote an earlier deployment from the Cloudflare Pages dashboard.

## The custom domain: sreerag.is-a.dev

### What is-a.dev is

[is-a.dev](https://is-a.dev) is a free service that gives developers a `name.is-a.dev` subdomain for a personal site. You register by adding a small JSON file to the public [`is-a-dev/register`](https://github.com/is-a-dev/register) repository through a pull request. After a volunteer maintainer reviews and merges it, the service publishes the DNS record for you. It is run by volunteers, reviews can take from a couple of hours to about three days, and they ask that you do not ping maintainers about a pending PR. Sites must be software-development related and non-commercial.

### What was submitted

- Pull request: `is-a-dev/register` #57365, "Register sreerag".
- File added: `domains/sreerag.json`, containing the GitHub owner, a contact email, and a CNAME to `sreerag.pages.dev`.
- State when this was written: all automated checks passed, the template was complete, and the PR was waiting for a maintainer review.

### Why a CNAME alone is not enough

The CNAME only makes browsers connect to Cloudflare. Cloudflare Pages chooses what to serve from the hostname, so `sreerag.is-a.dev` must also be added to the Pages project, otherwise visitors get an error page and no HTTPS certificate. The Cloudflare dashboard cannot add this name, because is-a.dev is on the Public Suffix List. It has to be added through Cloudflare's API.

### Remaining steps

1. Wait for the register PR to be merged. Do not ping the maintainers.
2. Add the domain to the Pages project through the API:
   `POST /accounts/<account id>/pages/projects/sreerag/domains` with body `{"name": "sreerag.is-a.dev"}`, using a short-lived token with the Pages Edit permission. Create the token just for this, and delete it afterwards. Do not reuse the GitHub Actions token. (The is-a.dev team also hosts a form at `cf-pages.is-a.dev` that does the same call through a third-party proxy; prefer sending the request yourself.)
3. Wait for Cloudflare to verify the DNS record and issue the certificate (usually minutes, occasionally up to an hour or so).
4. Verify `https://sreerag.is-a.dev`: HTTPS works, the site and assets load, and the headers are present.
5. Set the GitHub repository variable `SITE_URL` to `https://sreerag.is-a.dev` so the deploy smoke test checks the real address. Do not set it earlier, or every deploy would fail until the domain works.
6. Add a canonical URL to the app (`metadataBase` in `app/layout.tsx`), through a normal pull request.

## Known exceptions and limitations

- **npm audit gate is critical-only.** The open high-severity finding is PostCSS (4 advisories: GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849) bundled inside Next.js 15. It runs only at build time on this repository's own CSS, and the site ships as static files, so it is not reachable in production. The fix requires Next.js 16. Reassess when upgrading Next.js, and tighten the audit to `--audit-level=high` then. The comment in `security.yml` records the same thing.
- **No per-pull-request preview deployments.** Only `main` is published.
- **TypeScript is held at 5.x** by the Dependabot ignore rule until `typescript-eslint` supports 7.
- **Deploy secrets are real credentials.** If the Cloudflare token is ever exposed, revoke it in Cloudflare and create a new one.

## Where things live

| Concern                      | File                             |
| ---------------------------- | -------------------------------- |
| Static export                | `next.config.ts`                 |
| Pages project and output dir | `wrangler.jsonc`                 |
| Response headers and caching | `public/_headers`                |
| E2E server and CI settings   | `playwright.config.ts`           |
| Pull request validation      | `.github/workflows/ci.yml`       |
| Security scanning            | `.github/workflows/security.yml` |
| Production deploy            | `.github/workflows/deploy.yml`   |
| Dependency updates           | `.github/dependabot.yml`         |
| Node version                 | `.nvmrc`                         |
