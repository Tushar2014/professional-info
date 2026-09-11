# resume-site

Personal site: resume and writing. Astro 7, static output.

- `npm run dev` — local dev server
- `npm run build` — type check, then static build to `dist/`
- `npm test` — unit tests
- `npm run test:e2e` — Playwright specs

## Writing rule

Everything published here describes work that is internal and unreleased, so
every word has to be safe to publish. There is no automated gate. The rule is
simpler than a gate and does not need maintaining:

**Never write a company-specific word.** No internal service, repository, or
tool names. No ticket identifiers. No cluster, region, or environment names.
No table, index, or field names. No prompt text. No internal metrics or SLO
targets. No headcounts or coworker names.

Describe the shape of the problem and the reasoning instead. "A durable
document store became the system of record" carries the engineering; the
internal name carries only risk. Employer names and job titles are fine, since
they are already public.

`docs/superpowers/specs/` contains a worked before-and-after example that
quotes real internal names to show what redaction removes. That directory is
git-ignored and must stay unpublished.

## Design documents

- Spec: `docs/superpowers/specs/2026-09-04-resume-site-design.md`
- Plan: `docs/superpowers/plans/2026-09-04-resume-site.md`
