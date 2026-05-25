import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'];
}));

const baseUrl = args.get('url') ?? 'http://127.0.0.1:5174/';
const outputDir = args.get('out') ?? 'docs/student_readiness_screenshots/2026-05-24';
const widths = (args.get('widths') ?? '390,768,1024,1366')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value) && value > 0);

const internalTerms = [
  'Teacher login',
  'Admin login',
  'Supabase',
  'local-first',
  'canonical',
  'export',
  'placeholder',
  'Admin Console',
];

function viewportHeight(width) {
  if (width <= 430) return 844;
  if (width <= 800) return 900;
  if (width <= 1100) return 768;
  return 900;
}

function urlFor(pathnameOrHash) {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  if (pathnameOrHash.startsWith('#')) return `${base}/${pathnameOrHash}`;
  if (pathnameOrHash.startsWith('/')) return `${base}${pathnameOrHash}`;
  return `${base}/${pathnameOrHash}`;
}

async function waitForText(page, text) {
  await page.waitForFunction(
    (expected) => document.body?.innerText.includes(expected),
    text,
    { timeout: 15000 },
  );
}

async function clickByRole(page, name) {
  const button = page.getByRole('button', { name });
  await button.click({ timeout: 15000 });
}

async function clickByAnyRole(page, names) {
  for (const name of names) {
    const button = page.getByRole('button', { name });
    if (await button.count()) {
      await button.first().click({ timeout: 15000 });
      return;
    }
  }
  throw new Error(`None of these buttons were found: ${names.join(', ')}`);
}

async function fillByLabel(page, label, value) {
  await page.getByLabel(label, { exact: true }).fill(value, { timeout: 15000 });
}

async function collectMetrics(page, width, label) {
  return page.evaluate(({ internalTerms: terms, width: viewportWidth, label: pageLabel }) => {
    const visibleRect = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none') return undefined;
      if (rect.width <= 0 || rect.height <= 0) return undefined;
      if (rect.bottom <= 0 || rect.right <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth) return undefined;
      return rect;
    };

    const interactive = Array.from(document.querySelectorAll('button, a, input, select, textarea, summary'))
      .map((element) => ({ element, rect: visibleRect(element) }))
      .filter((item) => item.rect);

    const overlaps = [];
    for (let index = 0; index < interactive.length; index += 1) {
      for (let inner = index + 1; inner < interactive.length; inner += 1) {
        const first = interactive[index];
        const second = interactive[inner];
        if (first.element.contains(second.element) || second.element.contains(first.element)) continue;
        const xOverlap = Math.max(0, Math.min(first.rect.right, second.rect.right) - Math.max(first.rect.left, second.rect.left));
        const yOverlap = Math.max(0, Math.min(first.rect.bottom, second.rect.bottom) - Math.max(first.rect.top, second.rect.top));
        if (xOverlap * yOverlap > 24) {
          overlaps.push({
            first: first.element.textContent?.trim().slice(0, 80) || first.element.getAttribute('aria-label') || first.element.tagName,
            second: second.element.textContent?.trim().slice(0, 80) || second.element.getAttribute('aria-label') || second.element.tagName,
          });
        }
      }
    }

    const primaryActions = Array.from(document.querySelectorAll('.primary-button, .home-primary-entry, .region-home-primary-action'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) ?? '',
          disabled: Boolean(element.disabled),
          visibleInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
          rect: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          },
        };
      });

    const bodyText = document.body?.innerText ?? '';
    return {
      label: pageLabel,
      width: viewportWidth,
      url: window.location.href,
      title: document.title,
      bodyTextSample: bodyText.replace(/\s+/g, ' ').slice(0, 420),
      internalTermsFound: terms.filter((term) => bodyText.includes(term)),
      scroll: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        verticalOverflow: document.documentElement.scrollHeight > window.innerHeight + 2,
      },
      primaryActions,
      overlapCount: overlaps.length,
      overlapExamples: overlaps.slice(0, 5),
    };
  }, { internalTerms, width, label });
}

async function capture(page, width, label, metrics) {
  const fileName = `${width}-${label}.png`;
  const filePath = path.join(outputDir, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  metrics.push({ screenshot: filePath, ...(await collectMetrics(page, width, label)) });
}

function guardianAttempt(index, questionId, scoreRatio, subtopic) {
  const marksAvailable = 5;
  return {
    id: `browser-smoke-guardian-${index}`,
    profileId: 'profile-browser-smoke',
    questionId,
    paperFamily: 'p3',
    topicDisplayName: 'Logarithms',
    subtopic,
    marksEarned: Math.round(marksAvailable * scoreRatio * 10) / 10,
    marksAvailable,
    scoreRatio,
    mistakeType: 'no_issue',
    timeSpentSeconds: 180,
    markSchemeRevealed: true,
    attemptedAt: `2026-05-24T0${index}:00:00.000Z`,
    masteryEligible: true,
    validatedRegionId: 'logarithm-grove',
    displayRegionId: 'logarithm-grove',
    worldName: 'P3 Astral Academy',
    regionName: 'Logarithm Observatory',
  };
}

async function seedGuardianReadyState(page) {
  await page.evaluate(() => {
    const key = 'asterion.progress.v1';
    const progress = JSON.parse(localStorage.getItem(key) ?? '{}');
    progress.profile = {
      ...(progress.profile ?? {}),
      id: progress.profile?.id ?? 'profile-browser-smoke',
      realName: progress.profile?.realName ?? 'Pilot Student',
      classGroup: progress.profile?.classGroup ?? 'P3 Alpha',
      teacherName: progress.profile?.teacherName ?? 'Ms Hypatia',
      avatarName: progress.profile?.avatarName ?? 'Pilot Star',
      avatarId: progress.profile?.avatarId ?? 'custom-starter',
      onboardingCompleted: true,
      onboardingCompletedAt: progress.profile?.onboardingCompletedAt ?? '2026-05-24T00:00:00.000Z',
      createdAt: progress.profile?.createdAt ?? '2026-05-24T00:00:00.000Z',
      updatedAt: '2026-05-24T00:00:00.000Z',
      classClaim: {
        status: 'claimed',
        classId: 'class-p3-alpha',
        className: 'P3 Alpha',
        classCode: 'AST-P3A',
        teacherId: 'teacher-hypatia',
        teacherName: 'Ms Hypatia',
        rosterStudentId: 'roster-alpha-resettable-pilot',
        displayName: 'Pilot Student',
        message: 'Reusable pilot roster slot claimed.',
      },
    };
    progress.regionLearning = {
      ...(progress.regionLearning ?? {}),
      'logarithm-grove': {
        regionId: 'logarithm-grove',
        fieldGuideStartedAt: '2026-05-24T00:00:00.000Z',
        fieldGuideCompletedAt: '2026-05-24T00:05:00.000Z',
        updatedAt: '2026-05-24T00:05:00.000Z',
      },
    };
    progress.attempts = [
      ...(progress.attempts ?? []).filter((attempt) => attempt.validatedRegionId !== 'logarithm-grove'),
      window.__guardianAttempt1,
      window.__guardianAttempt2,
      window.__guardianAttempt3,
    ].filter(Boolean);
    localStorage.setItem(key, JSON.stringify(progress));
  });
}

async function runViewport(browser, width) {
  const height = viewportHeight(width);
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width <= 430,
  });
  const page = await context.newPage();
  const metrics = [];

  await page.goto(urlFor('/student-pilot?fresh=1'), { waitUntil: 'domcontentloaded' });
  await page.goto(urlFor('/'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Student entry');
  await capture(page, width, 'student-pilot-landing', metrics);

  await clickByRole(page, 'Student entry');
  await waitForText(page, "Join your teacher's class");
  await capture(page, width, 'class-code-roster-claim', metrics);

  await fillByLabel(page, 'Class code', 'AST-P3A');
  await fillByLabel(page, 'Roster name', 'Pilot Student');
  await clickByAnyRole(page, ['Claim roster slot', 'Enter class']);
  await waitForText(page, 'Name your academy character');
  await capture(page, width, 'avatar-name-setup', metrics);

  await fillByLabel(page, 'Character name', 'Pilot Star');
  await clickByRole(page, 'Continue to academy avatar');
  await waitForText(page, 'Welcome to Asterion');
  await capture(page, width, 'onboarding-welcome', metrics);

  await clickByRole(page, 'Next step');
  await waitForText(page, 'Confirm your academy identity');
  await capture(page, width, 'onboarding-name-step', metrics);

  await clickByRole(page, 'Continue');
  await waitForText(page, 'Choose a starter avatar');
  await capture(page, width, 'onboarding-avatar-step', metrics);

  await clickByRole(page, 'Continue');
  await waitForText(page, 'Ready to enter the academy');
  await capture(page, width, 'onboarding-final-enter-map', metrics);

  await clickByRole(page, 'Enter the P3 world map');
  await waitForText(page, 'World Map');
  await page.waitForTimeout(1200);
  await capture(page, width, 'world-map', metrics);

  await page.goto(urlFor('#/regions/integration-gardens'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Integral Terraces');
  await capture(page, width, 'locked-region-hub', metrics);

  await page.goto(urlFor('#/regions/integration-gardens/field-guide'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Field Guide');
  await capture(page, width, 'locked-region-field-guide', metrics);

  await page.goto(urlFor('#/regions/integration-gardens/quick-check'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Skill Practice is locked for this class');
  await capture(page, width, 'locked-region-quick-check-blocked', metrics);

  await page.goto(urlFor('#/regions/logarithm-grove/guardian'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Vault locked');
  await capture(page, width, 'guardian-locked-open-region', metrics);

  await page.addInitScript(({ attempts }) => {
    window.__guardianAttempt1 = attempts[0];
    window.__guardianAttempt2 = attempts[1];
    window.__guardianAttempt3 = attempts[2];
  }, {
    attempts: [
      guardianAttempt(1, '32spring23_q01', 0.76, 'logarithmic equations'),
      guardianAttempt(2, '33autumn23_q01', 0.82, 'exponential equations'),
      guardianAttempt(3, '31summer24_q02', 0.84, 'logarithmic equations'),
    ],
  });
  await page.evaluate((attempts) => {
    window.__guardianAttempt1 = attempts[0];
    window.__guardianAttempt2 = attempts[1];
    window.__guardianAttempt3 = attempts[2];
  }, [
    guardianAttempt(1, '32spring23_q01', 0.76, 'logarithmic equations'),
    guardianAttempt(2, '33autumn23_q01', 0.82, 'exponential equations'),
    guardianAttempt(3, '31summer24_q02', 0.84, 'logarithmic equations'),
  ]);
  await seedGuardianReadyState(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.goto(urlFor('#/regions/logarithm-grove'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Logarithm Observatory');
  await capture(page, width, 'unlocked-region-hub', metrics);

  await page.goto(urlFor('#/regions/logarithm-grove/guardian'), { waitUntil: 'domcontentloaded' });
  await waitForText(page, 'Guardian ready');
  await capture(page, width, 'guardian-unlocked-ready', metrics);

  const bodyText = await page.locator('body').innerText();
  if (bodyText.includes('Lantern Growth Gate') || bodyText.includes('Reveal placeholder guidance')) {
    throw new Error('Guardian unlocked state exposed placeholder challenge content.');
  }

  await context.close();
  return metrics;
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
});

const results = [];
try {
  for (const width of widths) {
    results.push(...await runViewport(browser, width));
  }
} finally {
  await browser.close();
}

const resultPath = path.join(outputDir, 'student-readiness-browser-smoke-results.json');
await writeFile(resultPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  browser: 'Playwright chromium.launch({ channel: "chrome" })',
  baseUrl,
  widths,
  results,
}, null, 2)}\n`);

const blockingLeaks = results.flatMap((result) => (
  result.internalTermsFound.length ? [{ screenshot: result.screenshot, internalTermsFound: result.internalTermsFound }] : []
));
const horizontalOverflow = results.filter((result) => result.scroll.horizontalOverflow);
const criticalMissingPrimary = results.filter((result) => (
  /landing|claim|setup|onboarding/.test(result.label)
  && !result.primaryActions.some((action) => action.visibleInViewport && !action.disabled)
));

if (blockingLeaks.length || horizontalOverflow.length || criticalMissingPrimary.length) {
  console.error(JSON.stringify({ blockingLeaks, horizontalOverflow, criticalMissingPrimary }, null, 2));
  process.exit(1);
}

console.log(`Student readiness browser smoke complete. ${results.length} screenshots written to ${outputDir}.`);
