# Static Study Cognitive-Load Pass

Date: 2026-05-31

## Guidance Used

No standalone report with `cognitive-load` in the filename was found. This pass used `tools/content_lab/reports/P3_STATIC_STUDY_CONTENT_AUDIT_2026_05_31.md`, especially its Field Guide, Practice Questions, Exam Training, and three-student usability findings.

## Pages Reviewed

- Homepage
- Regions compatibility page
- Topic hubs
- Algebra Field Guide and Practice
- Calculus Field Guide and Practice
- Integration Field Guide and Practice
- Exam Training

## Biggest Overload Risks

- Homepage and compatibility cards could drift into dashboard behavior if each topic repeats local progress.
- Field Guide sections showed worked examples, method tables, guided tries, worked routes, and takeaways at nearly equal visual weight.
- Practice pages placed progress and section navigation before students reached a question.
- Exam Training had explanatory mode content before students reached mixed Paper 3 questions.
- Long formula panels could create horizontal overflow or push useful content too low on mobile.

## Changes Made

- Removed repeated progress bars from topic cards.
- Kept Field Guide worked examples visible, then collapsed method tables, guided tries, and takeaway checks under optional support.
- Collapsed Field Guide section lists and saved progress into a compact disclosure block.
- Collapsed Practice page section lists and saved progress into a compact disclosure block.
- Moved Exam Training mode guidance into a single optional help disclosure and kept mixed questions prominent.
- Reduced hero scale, hid decorative hero formula panels on small screens, and tightened overflow handling for math-heavy sections.
- Preserved generated root `/topics/...` study pages while also satisfying the newer `/p3/...` static route contract.

## Remaining Risks

- Field Guide pages still contain many sections because the static site intentionally keeps full topic guides available on one page.
- Exam Training still uses the existing question selection logic; this pass did not change selection behavior.
- `guardian_prep` remains in generated/source data and content-lab reports, but it is not visible in generated HTML/CSS/JS. Treat it as a later data cleanup risk, not a current presentation leak.

## Recommended Follow-Up

Run a narrow mobile-first review of the topic hub and Practice page hero height after the course-route work settles, then resume the next content batch from the audit backlog.
