# P1 Field Guide Density Repair - Subtopic Route Separation

Key phrase: landing page is overview only; subtopic route is the lesson.

## 1. What was removed from the Field Guide landing page

P1 Field Guide landing pages no longer render:

- worked-example summary panels
- "Try a similar one" content
- the large guided-study subtopic lesson card
- phase/tab lesson controls
- duplicate "Next step" panels

The landing page now shows the topic header, short purpose sentence, "What you need to know", compact subtopic navigation, and one main CTA into the first subtopic.

## 2. How subtopic routes/views now work

P1 subtopics are generated as static Field Guide child routes. Examples checked:

- `/p1/topics/coordinate-geometry/field-guide/parallel-perpendicular-lines/`
- `/p1/topics/series/field-guide/arithmetic-progressions/`
- `/p1/topics/differentiation/field-guide/gradient-of-tangent/`

Each subtopic route renders the lesson content: subtopic title, one worked example, one try-similar task, reveal/check method, concise exam tip, exact Skill Check CTA, and next-subtopic action. The subtopic nav appears on landing and subtopic pages; current highlighting appears only on subtopic routes.

## 3. Skill Check next-question visibility fix

P1 Skill Check cards now include an inline continuation button inside the revealed answer area. After checking an answer:

- question 1/2 shows `Next question`
- question 3 shows `Next skill` when another group exists
- full worked steps remain behind `Show working`

This keeps continuation visible near the answer controls without forcing students through the full worked route.

## 4. Routes checked

- `/p1/topics/coordinate-geometry/field-guide/`
- `/p1/topics/coordinate-geometry/field-guide/parallel-perpendicular-lines/`
- `/p1/topics/series/field-guide/`
- `/p1/topics/series/field-guide/arithmetic-progressions/`
- `/p1/topics/differentiation/field-guide/`
- `/p1/topics/differentiation/field-guide/gradient-of-tangent/`
- `/p1/topics/coordinate-geometry/skill-check/`
- `/p1/topics/series/skill-check/`

## 5. Mobile QA result

Browser QA at 390px passed for all checked routes:

- no horizontal page overflow
- Field Guide landing pages showed overview/nav only
- subtopic routes showed exactly one worked example and one try-similar block
- Skill Check answer reveal kept `Next question` visible
- question 3 reveal showed `Next skill`
- no console errors observed
- no KaTeX error nodes observed

## 6. Validation commands and results

- `npm run build` - passed; generated 247 static HTML pages.
- `npm run static:check` - passed.
- `npm test` - passed; 56 files, 477 tests.
- `npm run test:ci` - passed; 56 files, 477 tests.
- `git diff --check` - passed.
- `npm run lint --if-present` - passed.
