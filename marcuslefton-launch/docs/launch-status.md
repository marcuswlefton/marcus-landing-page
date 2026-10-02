# Publishing readiness — 2026-10-02

## Completed
- Four primary pages and contact, legal, article, and confirmation destinations.
- Final homepage story copy; simplified visual without the staffing scenario.
- Advisory: stronger offer description, sourced endorsement below hero, one consolidated Performance Map section with readable sample.
- Homepage-first review with all pages connected. Review forms are simulations and send nothing.
- Existing Netlify configuration and Kit form IDs retained. No production publish or GitHub push performed.

## Verified on this revision
- Static checks for eleven core documents, metadata, assets, internal links and fragments, redirect configuration, and retired claims.
- Four primary pages at 1440, 390, and 320 pixels: no horizontal overflow or JavaScript page errors.
- Local simulated newsletter and advisory submissions reach the correct confirmation pages at all three sizes.
- Mocked server form-handler tests pass; these do not establish live Kit delivery.
- Mobile menu, Escape, manual story controls, finite story playback, logo pause, and reduced-motion behavior.
- Advisory desktop and mobile rendered inspection: no broken images or unlabeled buttons in the check.

## Required before production
1. Deploy this exact repository revision through the existing Netlify preview pipeline. The inline review HTML is not the production site; its forms deliberately simulate submissions.
2. Confirm KIT_API_KEY is configured in the deployment environment, without exposing its value.
3. Use a designated test address to verify newsletter form 9270901, opt-in/welcome delivery, and confirmation behavior.
4. Verify advisory form 9586922 records every application field and that Marcus receives the configured notification. Confirm advisory applicants are not inadvertently enrolled in newsletter marketing.
5. Check deployed legacy redirects, canonical domain, and both form error/success paths; approve production promotion only after delivery is verified.

## Boundaries
- Session cadence, between-session access, and client workload remain individually agreed before payment, as the page states. Do not introduce invented standard terms.
- No live email submission was made. No production performance benchmark or complete accessibility certification is claimed.
- Kit source attribution is present; qualified-enquiry status still requires review. No conversion analytics dashboard is configured.

## Publication workflow
Use the existing repository and Netlify deployment, retaining assets, generated page folders, _redirects, netlify.toml, and netlify/functions plus netlify/lib. Do not publish only the preview HTML or only index.html: that would omit routes and real form handling.
