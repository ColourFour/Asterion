# Dark Mode WCAG Contrast Audit - 2026-07-01

Scope: rendered `docs/**/index.html` in Chromium with `colorScheme: dark` at desktop 1280x900 and mobile 390x844.

Text was checked against WCAG 2.2 Level AA thresholds: 4.5:1 for normal text and 3:1 for large/bold text. UI borders and visible component surfaces were checked against the 3:1 non-text contrast threshold.

Full raw grouped audit: `reports/dark-mode-contrast-audit-2026-07-01.json`.

## Result

Audited pages: 57

Raw failing element instances: 0

Text failures: 0

Border failures: 0

Surface failures: 0

Grouped failures: 0

## Notes

- The audit was rerun after the dark-mode contrast remediation in `src/static-study/static-study.css` and the generated `docs/assets/static-study.css`.
- The static HTML bootstrap now applies system dark mode before CSS loads, preventing transition-time contrast failures during automated scans.
- Decorative borders that could not contrast with both adjacent surfaces were removed in dark mode; visible surfaces now carry the contrast boundary.
