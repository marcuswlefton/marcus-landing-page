# Marcus Lefton / VYRTŪOSITI

The source for [marcuslefton.com](https://www.marcuslefton.com), built as a dependency-light static site with Netlify Functions for the existing Kit integrations.

## Public structure

- `/` — Marcus Lefton and VYRTŪOSITI
- `/advisory/` — the $5,000 / 30-Day Performance Architecture Intensive and application
- `/evidence/` — detailed case, selected client accounts, and example Performance Map
- `/mastery-in-motion/` — the publication and newsletter signup
- `/mastery-in-motion/the-cost-of-compensation/` — field note exemplar
- `/contact/`, `/privacy/`, `/terms-of-service/` — utility pages
- `/thankyou/`, `/application-received/` — confirmed form journeys

Flow Prone, the MED guide, and the diagnostic are retained outside the primary navigation. Older offer URLs are deliberately redirected in `_redirects`; their previous source remains recoverable in Git history.

## Editing and generation

Shared public-page markup lives in `tools/build_site.py`. Edit that file for common navigation, footer, or primary-page copy, then run:

```bash
python tools/build_site.py
```

Global presentation and interaction are in `assets/site.css` and `assets/site.js`. Keep generated HTML and its generator in the same commit.

## Verification

```bash
node --test tools/forms.test.cjs
python tools/static-check.py
node tools/browser-qa.cjs
```

Browser QA uses a local simulated Kit transport. It never creates a subscriber or an application. It checks the public pages at desktop and mobile sizes, WCAG A/AA issues, keyboard operation, images, links, console errors, form failure handling, and confirmation routes.

## Forms and deployment

The live host is Netlify. It needs the existing `KIT_API_KEY` environment variable. Form IDs are intentionally fixed in `netlify/lib/forms.js`:

- Mastery in Motion: Kit form `9270901`
- Private advisory application: Kit form `9586922`

The functions require a provider-confirmed subscription ID before displaying success. Failed or uncertain submissions remain on the form and offer the direct email fallback.

Pushing `main` triggers the existing Netlify deployment. The linked Vercel mirror redirects to the canonical Netlify domain so there is one public source of truth.

Supporting launch copy, evidence decisions, and route decisions are in `docs/`.

## Selected essays

Edit essay content and metadata in `tools/essays.json`, then run `python tools/build_site.py` and `python tools/static-check.py`. Commit the generated pages, sitemap, and source together. Keep existing slugs when updating an essay. Publication dates refer to the website edition; update the modified date only when content materially changes.

Editorial styles live in `assets/essays.css`. The newsletter page automatically lists the selected essays. New articles require adding their route to the essay allowlist in `assets/site.js` and the core documents in `tools/static-check.py`.

Attribution retains the first selected essay viewed and campaign labels for the current browser tab. Forms append these to the existing Kit source fields; no new Kit field is required. This is same-tab attribution, not cross-device tracking or proof of causation. Never put personal data in campaign parameters.

October 5 content release: three essays were checked at 320, 390, and 1440 pixels, with automated WCAG A/AA checks. Local simulated-provider checks covered application failure/retry, newsletter confirmation, article/campaign attribution, unavailable storage, and readable content with JavaScript disabled. These tests do not create a real Kit subscriber or verify email delivery. Search Console indexing and live provider delivery require separate account-level verification.

## Featured essay, case, and lead attribution

The featured essay is selected in `tools/build_site.py`; supporting essays remain sourced from `tools/essays.json`. The commercial case lives in `tools/commercial-case.html`, and its additional presentation lives in `assets/conversion.css`.

Application responses use the existing Kit form plus `advisory_prompted_by` and `advisory_journey`. These fields and the manual `advisory_stage` field were created in Kit on October 5. Sales stages are not overwritten by website submissions. Prepared distribution copy, campaign URLs, stage definitions, and measurement limits are in `docs/distribution-and-measurement.md`.

Keep `googlefed99dda8152e2b3.html` at the website root for Search Console ownership verification. The retired launch-copy directory is redirected; its source remains in Git.

The October 5 refinement passed 24 responsive WCAG A/AA audits across eight pages at 320/390/1440 pixels, with no page errors or horizontal overflow. Mock form tests cover the new attribution fields and preserve existing application/subscription confirmation behavior. These checks do not send email or create subscribers.
