import type { ReactNode } from 'react';
import { StudentOnboarding } from '../onboarding/StudentOnboarding';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import { P3AstralAcademy } from '../world/P3AstralAcademy';
import { determineAvatarLocation } from '../../lib/avatarLocation';
import { emptyProgress } from '../../lib/progressStore';
import { P3_ASTRAL_ACADEMY } from '../../lib/worldMap';
import type { AvatarSettings, RegionProgress, RegionRank, StudentProfile } from '../../types';

type ReviewBadge = 'Live route' | 'Preview route' | 'Mock state' | 'Requires login' | 'Not yet covered';

interface ReviewItem {
  title: string;
  description: string;
  route: string;
  href?: string;
  badges: ReviewBadge[];
}

interface ReviewSection {
  title: string;
  items: ReviewItem[];
}

const previewRoutes = new Set([
  'student-entry',
  'student-onboarding',
  'avatar',
  'world-map',
  'system-loading',
  'system-empty',
  'system-error',
]);

const regionReviewNames = [
  'Algebra Vault',
  'Logarithm Observatory',
  'Trigonometry Spire',
  'Argand Atrium',
  'Calculus Cliffs',
  'Integral Terraces',
  'Vectors Gate',
  'Iteration Forge',
  'Differential Shrine',
];

function regionIdByName(regionName: string): string {
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.name === regionName);
  return region?.id ?? regionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function regionReviewRoute(regionName: string, page?: string): string {
  const suffix = page ? `/${page}` : '';
  return `/#/regions/${regionIdByName(regionName)}${suffix}`;
}

function regionReviewHref(regionName: string, page?: string): string {
  const suffix = page ? `/${page}` : '';
  return `#/regions/${regionIdByName(regionName)}${suffix}`;
}

const reviewSections: ReviewSection[] = [
  {
    title: 'Student Flow',
    items: [
      {
        title: 'Home landing',
        description: 'Public entry surface with student, teacher, and admin entry actions.',
        route: '/#/',
        href: '#/',
        badges: ['Live route'],
      },
      {
        title: 'Student class-code / roster-name entry',
        description: 'Internal mock view of the student claim form without live roster writes.',
        route: '/#/ui-review/student-entry',
        href: '#/ui-review/student-entry',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Student onboarding / welcome',
        description: 'Mock first-day avatar choice and welcome flow.',
        route: '/#/ui-review/student-onboarding',
        href: '#/ui-review/student-onboarding',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Avatar/profile setup',
        description: 'Mock character/profile setup state for visual review.',
        route: '/#/ui-review/avatar',
        href: '#/ui-review/avatar',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Returning student map state',
        description: 'Mock returning student with region progress on the P3 world map.',
        route: '/#/ui-review/world-map',
        href: '#/ui-review/world-map',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'No-class / claim-required state',
        description: 'Live student entry path still requires a class-code roster claim.',
        route: '/#/student',
        href: '#/student',
        badges: ['Live route'],
      },
      {
        title: 'Claim error state',
        description: 'Safe internal error-state preview. Does not submit a roster claim.',
        route: '/#/ui-review/system-error',
        href: '#/ui-review/system-error',
        badges: ['Preview route', 'Mock state'],
      },
    ],
  },
  {
    title: 'World And Regions',
    items: [
      {
        title: 'World map',
        description: 'Mock P3 Astral Academy map with returning-student progress.',
        route: '/#/ui-review/world-map',
        href: '#/ui-review/world-map',
        badges: ['Preview route', 'Mock state'],
      },
      ...regionReviewNames.map((title) => ({
        title,
        description: `Live region hub for ${title}. May depend on loaded bank data and student context.`,
        route: regionReviewRoute(title),
        href: regionReviewHref(title),
        badges: ['Live route'] as ReviewBadge[],
      })),
    ],
  },
  {
    title: 'Region Access States',
    items: [
      {
        title: 'Locked / field-guide-only state',
        description: 'State is represented on live region routes when class region access is restricted.',
        route: 'Not yet previewed',
        badges: ['Not yet covered'],
      },
      {
        title: 'Open state',
        description: 'Use any live region hub or the mock world map for first-pass layout review.',
        route: regionReviewRoute('Algebra Vault'),
        href: regionReviewHref('Algebra Vault'),
        badges: ['Live route'],
      },
      {
        title: 'Completed/progress state',
        description: 'Mock world map includes mixed progress badges for a returning student.',
        route: '/#/ui-review/world-map',
        href: '#/ui-review/world-map',
        badges: ['Preview route', 'Mock state'],
      },
    ],
  },
  {
    title: 'Learning Pages',
    items: [
      {
        title: 'Field Guide',
        description: 'Live learning page for the Algebra Vault Field Guide.',
        route: regionReviewRoute('Algebra Vault', 'field-guide'),
        href: regionReviewHref('Algebra Vault', 'field-guide'),
        badges: ['Live route'],
      },
      {
        title: 'Quick Check',
        description: 'Live region Quick Check route.',
        route: regionReviewRoute('Algebra Vault', 'quick-check'),
        href: regionReviewHref('Algebra Vault', 'quick-check'),
        badges: ['Live route'],
      },
      {
        title: 'Warm-Up',
        description: 'Live region Warm-Up route.',
        route: regionReviewRoute('Algebra Vault', 'warm-up'),
        href: regionReviewHref('Algebra Vault', 'warm-up'),
        badges: ['Live route'],
      },
      {
        title: 'Practice / Exam Training',
        description: 'Live region Exam Training route.',
        route: regionReviewRoute('Algebra Vault', 'exam-training'),
        href: regionReviewHref('Algebra Vault', 'exam-training'),
        badges: ['Live route'],
      },
      {
        title: 'Guardian locked state',
        description: 'Live Guardian page shows lock guidance when evidence is incomplete.',
        route: regionReviewRoute('Algebra Vault', 'guardian'),
        href: regionReviewHref('Algebra Vault', 'guardian'),
        badges: ['Live route'],
      },
      {
        title: 'Guardian ready/open state',
        description: 'Needs a dedicated fixture once Guardian-ready evidence can be mocked cleanly.',
        route: 'Not yet previewed',
        badges: ['Not yet covered'],
      },
    ],
  },
  {
    title: 'Teacher/Admin',
    items: [
      {
        title: 'Teacher dashboard',
        description: 'Live teacher route. Normal auth and role checks still apply.',
        route: '/#/teacher',
        href: '#/teacher',
        badges: ['Live route', 'Requires login'],
      },
      {
        title: 'Teacher class detail',
        description: 'Live teacher class route using the demo class id where enabled.',
        route: '/#/teacher/classes/class-p3-alpha',
        href: '#/teacher/classes/class-p3-alpha',
        badges: ['Live route', 'Requires login'],
      },
      {
        title: 'Teacher roster page',
        description: 'Live teacher roster route. Can mutate roster after real login.',
        route: '/#/teacher/classes/class-p3-alpha/roster',
        href: '#/teacher/classes/class-p3-alpha/roster',
        badges: ['Live route', 'Requires login'],
      },
      {
        title: 'Teacher region access page',
        description: 'Live class region access route. Can mutate access after real login.',
        route: `/#/teacher/classes/class-p3-alpha/regions/${regionIdByName('Algebra Vault')}`,
        href: `#/teacher/classes/class-p3-alpha/regions/${regionIdByName('Algebra Vault')}`,
        badges: ['Live route', 'Requires login'],
      },
      {
        title: 'Admin dashboard',
        description: 'Live admin route. Normal auth and role checks still apply.',
        route: '/#/admin',
        href: '#/admin',
        badges: ['Live route', 'Requires login'],
      },
      {
        title: 'Admin teacher setup/invite area',
        description: 'Covered by the live admin dashboard when the signed-in role is admin.',
        route: '/#/admin',
        href: '#/admin',
        badges: ['Live route', 'Requires login'],
      },
    ],
  },
  {
    title: 'System States',
    items: [
      {
        title: 'Loading state',
        description: 'Mock internal loading panel.',
        route: '/#/ui-review/system-loading',
        href: '#/ui-review/system-loading',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Empty state',
        description: 'Mock internal empty-state panel.',
        route: '/#/ui-review/system-empty',
        href: '#/ui-review/system-empty',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Error state',
        description: 'Mock internal error-state panel.',
        route: '/#/ui-review/system-error',
        href: '#/ui-review/system-error',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Runtime configuration blocked diagnostic',
        description: 'Use the live app with blocked env settings, or review the mock error state first.',
        route: '/#/ui-review/system-error',
        href: '#/ui-review/system-error',
        badges: ['Preview route', 'Mock state'],
      },
      {
        title: 'Teacher/admin sign-in required state',
        description: 'Open live teacher/admin routes in hosted dashboard mode.',
        route: '/#/teacher',
        href: '#/teacher',
        badges: ['Live route', 'Requires login'],
      },
      {
        title: 'Access denied / role missing state',
        description: 'Open live staff routes with a signed-in account missing the required role.',
        route: '/#/admin',
        href: '#/admin',
        badges: ['Live route', 'Requires login'],
      },
    ],
  },
];

function mockProfile(): StudentProfile {
  return {
    id: 'ui-review-student',
    realName: 'Review Student',
    classGroup: 'P3 Alpha',
    teacherName: 'Asterion Teacher',
    avatarName: 'Nova',
    avatarId: 'star-apprentice',
    onboardingCompleted: true,
    onboardingCompletedAt: '2026-05-22T00:00:00.000Z',
    createdAt: '2026-05-22T00:00:00.000Z',
    updatedAt: '2026-05-22T00:00:00.000Z',
  };
}

function mockAvatar(): AvatarSettings {
  return {
    ...emptyProgress().avatar,
    palette: 'aqua',
    crest: 'star',
  };
}

function mockRegionProgress(): RegionProgress[] {
  const ranks: Record<string, { rank: RegionRank; attempts: number; ratio?: number; subtopicsTouched?: number }> = {
    'algebra-forge': { rank: 'Silver', attempts: 8, ratio: 0.72, subtopicsTouched: 4 },
    'logarithm-grove': { rank: 'Bronze', attempts: 4, ratio: 0.58, subtopicsTouched: 2 },
    'trig-observatory': { rank: 'Discovered', attempts: 1, ratio: 0.45, subtopicsTouched: 1 },
    'complex-harbor': { rank: 'Discovered', attempts: 0 },
    'calculus-cliffs': { rank: 'Dormant', attempts: 0 },
    'integration-gardens': { rank: 'Dormant', attempts: 0 },
    'vector-workshop': { rank: 'Dormant', attempts: 0 },
    'numerical-mines': { rank: 'Dormant', attempts: 0 },
    'differential-shrine': { rank: 'Dormant', attempts: 0 },
  };

  return P3_ASTRAL_ACADEMY.regions.map((region) => {
    const state = ranks[region.id] ?? { rank: 'Discovered' as RegionRank, attempts: 0 };
    const availableQuestions = region.activeByDefault || state.rank !== 'Dormant' ? 6 : 0;
    const totalMarksAvailable = state.attempts > 0 ? state.attempts * 10 : 0;
    const totalMarksEarned = state.ratio ? Math.round(totalMarksAvailable * state.ratio) : 0;
    return {
      region,
      availableQuestions,
      attempts: state.attempts,
      totalMarksEarned,
      totalMarksAvailable,
      averageScoreRatio: state.ratio,
      recentScoreRatio: state.ratio,
      subtopicsTouched: state.subtopicsTouched ?? 0,
      rank: state.rank,
      isActive: availableQuestions > 0,
    };
  });
}

function UiReviewHeader({ eyebrow = 'Internal review surface' }: { eyebrow?: string }) {
  return (
    <header className="ui-review-header">
      <a className="ui-review-back-link" href="#/ui-review">Back to UI Review</a>
      <span className="mode-pill">{eyebrow}</span>
      <h1>Asterion UI Review</h1>
      <p>Internal review surface. Do not use with students.</p>
    </header>
  );
}

function Badge({ badge }: { badge: ReviewBadge }) {
  return <span className={`ui-review-badge badge-${badge.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{badge}</span>;
}

function ReviewCard({ item }: { item: ReviewItem }) {
  const isAvailable = Boolean(item.href);
  return (
    <article className={`ui-review-card${isAvailable ? '' : ' is-disabled'}`}>
      <div className="ui-review-card-copy">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
      <code>{item.route}</code>
      <div className="ui-review-badges">
        {item.badges.map((badge) => <Badge badge={badge} key={badge} />)}
      </div>
      {isAvailable ? (
        <a className="ui-review-open-button" href={item.href}>Open</a>
      ) : (
        <span className="ui-review-open-button disabled" aria-disabled="true">Not covered</span>
      )}
    </article>
  );
}

function UiReviewIndex() {
  return (
    <main className="app-shell ui-review-shell">
      <UiReviewHeader />

      <section className="ui-review-usage" aria-labelledby="ui-review-usage-title">
        <h2 id="ui-review-usage-title">How to use this page</h2>
        <ol>
          <li>Open /#/ui-review.</li>
          <li>Choose a section: Student flow, World/regions, Learning pages, Teacher/admin, or System states.</li>
          <li>Open a review item.</li>
          <li>Review layout, copy, flow, and broken states.</li>
          <li>Record the needed fix.</li>
          <li>Return to /#/ui-review for the next screen.</li>
        </ol>
        <div className="ui-review-label-guide" aria-label="UI review label guide">
          <p><strong>Live route:</strong> opens the real app route and may require login/context.</p>
          <p><strong>Preview route:</strong> read-only fixture state used for visual review.</p>
          <p><strong>Mock state:</strong> fake local data, no Supabase writes.</p>
          <p><strong>Requires login:</strong> normal auth still applies.</p>
          <p><strong>Not yet covered:</strong> listed for cleanup planning, but no stable preview exists yet.</p>
        </div>
      </section>

      {reviewSections.map((section) => (
        <section className="ui-review-section" aria-labelledby={`ui-review-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={section.title}>
          <h2 id={`ui-review-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{section.title}</h2>
          <div className="ui-review-grid">
            {section.items.map((item) => <ReviewCard item={item} key={`${section.title}:${item.title}`} />)}
          </div>
        </section>
      ))}
    </main>
  );
}

function PreviewFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="app-shell ui-review-shell ui-review-preview-shell">
      <UiReviewHeader eyebrow="Preview / internal" />
      <section className="ui-review-preview-panel" aria-labelledby="ui-review-preview-title">
        <span className="mode-pill">Mock state</span>
        <h2 id="ui-review-preview-title">{title}</h2>
        <p>Preview / internal. This fixture uses local mock data and does not write to Supabase.</p>
      </section>
      {children}
    </main>
  );
}

function StudentEntryPreview() {
  return (
    <PreviewFrame title="Student class-code / roster-name entry">
      <form className="profile-form class-code-claim-form ui-review-mock-form" aria-label="Preview class roster slot">
        <div className="claim-form-heading">
          <span className="mode-pill">Class access required</span>
          <h2>Join your teacher's class</h2>
          <p>Enter the class code and roster name your teacher gave you.</p>
          <p className="claim-form-note">Your teacher must add your roster name first. You cannot add yourself to a class.</p>
        </div>
        <label>
          Class code
          <input readOnly value="AST-P3A" />
        </label>
        <label>
          Roster name
          <input readOnly value="Review Student" />
        </label>
        <p className="claim-state-message">Preview only: no roster lookup, claim RPC, or Supabase write is run here.</p>
        <button className="primary-button" type="button" disabled>Preview only</button>
      </form>
    </PreviewFrame>
  );
}

function StudentOnboardingPreview() {
  const profile = { ...mockProfile(), onboardingCompleted: false, avatarName: 'Nova' };
  return (
    <>
      <main className="app-shell ui-review-shell ui-review-preview-shell">
        <UiReviewHeader eyebrow="Preview / internal" />
        <section className="ui-review-preview-panel" aria-labelledby="ui-review-preview-title">
          <span className="mode-pill">Mock state</span>
          <h2 id="ui-review-preview-title">Student onboarding / welcome</h2>
          <p>Preview / internal. This fixture uses local mock data and does not write to Supabase.</p>
        </section>
      </main>
      <div className="ui-review-embedded-preview ui-review-standalone-preview">
        <StudentOnboarding profile={profile} onComplete={() => undefined} />
      </div>
    </>
  );
}

function AvatarPreviewPage() {
  const progress = mockRegionProgress();
  const profile = mockProfile();
  return (
    <PreviewFrame title="Avatar/profile setup">
      <section className="ui-review-avatar-preview">
        <AvatarRenderer avatarName={profile.avatarName} avatar={mockAvatar()} regionProgress={progress} mode="builder" />
        <div className="ui-review-avatar-copy">
          <h3>{profile.avatarName}</h3>
          <p>Mock profile for checking avatar composition, reward framing, and profile copy without saving progress.</p>
          <dl>
            <div><dt>Class</dt><dd>{profile.classGroup}</dd></div>
            <div><dt>Teacher</dt><dd>{profile.teacherName}</dd></div>
            <div><dt>State</dt><dd>Returning student preview</dd></div>
          </dl>
        </div>
      </section>
    </PreviewFrame>
  );
}

function WorldMapPreview() {
  const progress = mockRegionProgress();
  const avatar = mockAvatar();
  return (
    <PreviewFrame title="Returning student map state">
      <P3AstralAcademy
        world={P3_ASTRAL_ACADEMY}
        progress={progress}
        avatarName="Nova"
        avatar={avatar}
        avatarLocation={determineAvatarLocation({ progress })}
        notice="Preview / internal: mock progress only. Opening a region from this fixture is disabled."
        onTrain={() => undefined}
      />
    </PreviewFrame>
  );
}

function SystemStatePreview({ state }: { state: 'loading' | 'empty' | 'error' }) {
  const copy = {
    loading: {
      pill: 'Loading state',
      title: 'Loading classroom context...',
      body: 'Use this fixture to inspect spacing, progress messaging, and busy-state contrast.',
      role: 'status' as const,
    },
    empty: {
      pill: 'Empty state',
      title: 'No review data available',
      body: 'Use this fixture for panels where a class, roster, question bank, or progress set is intentionally empty.',
      role: 'status' as const,
    },
    error: {
      pill: 'Error state',
      title: 'Something needs attention',
      body: 'Mock diagnostic: runtime configuration or roster claim failed. No live request was made.',
      role: 'alert' as const,
    },
  }[state];

  return (
    <PreviewFrame title={copy.pill}>
      <section className={`ui-review-system-state ui-review-system-${state}`} role={copy.role}>
        <span className="mode-pill">{copy.pill}</span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <a className="quiet-button" href="#/ui-review">Return to UI Review</a>
      </section>
    </PreviewFrame>
  );
}

function UiReviewNotFound({ page }: { page: string }) {
  return (
    <main className="app-shell ui-review-shell">
      <UiReviewHeader />
      <section className="ui-review-system-state ui-review-system-error" role="alert">
        <span className="mode-pill">Internal route guidance</span>
        <h2>Unknown UI review page</h2>
        <p>There is no stable preview for /#/ui-review/{page}. Return to the index and choose a listed review item.</p>
        <a className="primary-button" href="#/ui-review">Open UI Review index</a>
      </section>
    </main>
  );
}

export function UiReview({ page }: { page: string }) {
  if (page === 'index') return <UiReviewIndex />;
  if (!previewRoutes.has(page)) return <UiReviewNotFound page={page} />;
  if (page === 'student-entry') return <StudentEntryPreview />;
  if (page === 'student-onboarding') return <StudentOnboardingPreview />;
  if (page === 'avatar') return <AvatarPreviewPage />;
  if (page === 'world-map') return <WorldMapPreview />;
  if (page === 'system-loading') return <SystemStatePreview state="loading" />;
  if (page === 'system-empty') return <SystemStatePreview state="empty" />;
  return <SystemStatePreview state="error" />;
}
