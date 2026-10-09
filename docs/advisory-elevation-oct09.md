# Advisory presentation update · October 9, 2026

The advisory page now explains the connection between the person, skills, and surrounding systems, demonstrates the judgment through a three-stage Jason case, and substantiates Marcus's perspective with a dedicated advisor section and two complementary client cases.

## Editing

- Page copy and structure: `tools/advisory.html`
- Interactive explanation: `tools/advisory-system.html`
- Page styling: `assets/advisory.css`
- Diagram styling and behavior: `assets/advisory-system.css` and `assets/advisory-system.js`
- Shared application and page generation: `tools/build_site.py`

Run `python tools/build_site.py` after edits. Commit generated `advisory/index.html` with its sources. The generator fingerprints the new assets and only includes them on the advisory page.

## What changed

- Clearer opening and recognizable buying situations.
- One user-controlled explanation: see the whole picture, find the constraint, test and refine. Each stage connects the diagram to a documented engagement.
- Jason and the anonymous technology case demonstrate different applications. The longer technology partnership is explicitly labeled.
- A portrait-led advisor section connects professional baseball, performance science and technology, and entrepreneurship to Marcus's judgment.
- A single offer section explains the $5,000 / 30-day Intensive, Performance Map, working sessions, and implementation expectations.

## Verification

- Static check passed for all 16 core documents, internal links, anchors, assets, metadata, and handlers.
- Rendered advisory at 320, 390, 768, 1024, and 1440px; no horizontal overflow or browser errors.
- Automated WCAG A/AA checks found no violations at those widths. This is an automated check, not a full accessibility certification.
- Verified all three visual stages, keyboard activation and focus, case links, FAQ disclosure, and application anchor.
- Reduced-motion behavior and the complete no-JavaScript explanation checked.
- Local simulated form tests confirmed required-field validation, error recovery without losing input, successful confirmation, and case/campaign attribution.
- The actual Kit delivery was not exercised. Existing form markup, function handlers, provider routing, and consent wording are unchanged.

No new performance guarantees, institutional endorsements, session counts, or response-time commitments were introduced.
