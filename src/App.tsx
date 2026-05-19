import { useEffect, useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { ClassHall } from './components/classHall/ClassHall';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { TeacherDashboard } from './components/dashboard/TeacherDashboard';
import { ClassCodeClaimForm } from './components/onboarding/ClassCodeClaimForm';
import { ProfileForm } from './components/onboarding/ProfileForm';
import { AvatarBuilder } from './components/profile/AvatarBuilder';
import { PracticeView } from './components/practice/PracticeView';
import { TwinklingStarfield } from './components/shared/TwinklingStarfield';
import { AstralRegionLedger, P3AstralAcademy } from './components/world/P3AstralAcademy';
import { RegionHub } from './components/world/RegionHub';
import { getRegionFieldGuide } from './data/regionFieldGuides';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { deriveAvatarGear } from './lib/avatarGear';
import { determineAvatarLocation } from './lib/avatarLocation';
import { resolveRuntimeConfig } from './lib/appConfig';
import { canStudentUseRegionActivity, getStudentRegionAccess, lockedRegionMessage } from './lib/classRegionAccess';
import { getGeneratedPracticeForRegion, loadGeneratedPractice, type GeneratedPracticeItem } from './lib/generatedPractice';
import { loadQuestionBankWithDiagnostics } from './lib/loadQuestionBank';
import { createId, getProgressStorageAdapter } from './lib/progressStore';
import { filterTrainableQuestionsForRegion, isQuestionTrainable, isTrainableP3Question } from './lib/questionTraining';
import { buildRegionLearningSummary, GUARDIAN_PASS_SCORE_RATIO } from './lib/regionLearning';
import { calculateWorldProgress, filterMasteryAttemptsForRegion } from './lib/regionProgress';
import { validatePendingClassClaim } from './lib/dashboardMockService';
import {
  getP3RegionById,
  parseAsterionHashRoute,
  regionHashPath,
  type RegionLearningPageId,
} from './lib/regionRoutes';
import { clearPendingClassClaim, loadPendingClassClaim, savePendingClassClaim } from './lib/studentClassClaimStore';
import { getTeachingSnippetsForRegion, loadTeachingSnippets, type TeachingSnippet } from './lib/teachingSnippets';
import { isP3Question, P3_ASTRAL_ACADEMY, P3_WORLD_NAME } from './lib/worldMap';
import type { Attempt, IssueType, LearningActivityAttempt, NormalizedQuestion, RegionDefinition, StoredProgress, StudentClaimState, StudentProfile, TrainingSessionIntent } from './types';

type ViewMode = PracticeMode | 'map' | 'regions' | 'region_hub' | 'guardian' | 'profile' | 'class_hall';

type TeacherDashboardRoute = {
  kind: 'teacher';
  classId?: string;
  page: 'home' | 'class' | 'roster' | 'region';
  regionId?: string;
};

function loadValidatedPendingClassClaim(): StudentClaimState | undefined {
  const pendingClaim = loadPendingClassClaim();
  const validatedClaim = validatePendingClassClaim(pendingClaim);
  if (pendingClaim && !validatedClaim) clearPendingClassClaim();
  return validatedClaim;
}

function parseDashboardRoute(pathname: string, hash: string): TeacherDashboardRoute | { kind: 'admin' } | { kind: 'student' } {
  const hashPath = hash.startsWith('#/') ? hash.slice(1) : '';
  const routePath = hashPath.startsWith('/teacher') || hashPath.startsWith('/admin') ? hashPath : pathname;
  if (routePath === '/admin' || routePath.startsWith('/admin/')) return { kind: 'admin' };
  if (routePath === '/teacher') return { kind: 'teacher', page: 'home' };
  const teacherRosterMatch = routePath.match(/^\/teacher\/classes\/([^/]+)\/roster$/);
  if (teacherRosterMatch) return { kind: 'teacher', classId: teacherRosterMatch[1], page: 'roster' };
  const teacherRegionMatch = routePath.match(/^\/teacher\/classes\/([^/]+)\/regions\/([^/]+)$/);
  if (teacherRegionMatch) return { kind: 'teacher', classId: teacherRegionMatch[1], page: 'region', regionId: teacherRegionMatch[2] };
  const teacherClassMatch = routePath.match(/^\/teacher\/classes\/([^/]+)$/);
  if (teacherClassMatch) return { kind: 'teacher', classId: teacherClassMatch[1], page: 'class' };
  return { kind: 'student' };
}

function DisabledDashboardRoute({ routeKind, onNavigatePath }: { routeKind: 'teacher' | 'admin'; onNavigatePath: (path: string) => void }) {
  return (
    <main className="app-shell onboarding-shell">
      <TwinklingStarfield />
      <section className="intro-panel academy-admission">
        <div className="intro-copy">
          <span className="mode-pill">Demo dashboard disabled</span>
          <h1>Asterion</h1>
          <p>
            The {routeKind === 'teacher' ? 'teacher dashboard' : 'admin console'} is a private demo route and is not
            available in this build.
          </p>
        </div>
        <div className="onboarding-briefing">
          <strong>Student app active</strong>
          <span>Normal Paper 3 practice still runs locally without Supabase or hosted classroom access.</span>
          <span>Set VITE_ASTERION_DASHBOARD_DEMO=enabled only for an intentional local dashboard demo.</span>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigatePath('/')}>
          Student app
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const runtimeConfig = useMemo(() => resolveRuntimeConfig(), []);
  const progressAdapter = useMemo(() => getProgressStorageAdapter(), []);
  const [dashboardLocation, setDashboardLocation] = useState(() => `${window.location.pathname}${window.location.hash}`);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [teachingSnippets, setTeachingSnippets] = useState<TeachingSnippet[]>([]);
  const [generatedPractice, setGeneratedPractice] = useState<GeneratedPracticeItem[]>([]);
  const [progress, setProgress] = useState<StoredProgress>(() => progressAdapter.loadProgressContext());
  const [studentClassClaim, setStudentClassClaim] = useState<StudentClaimState | undefined>(() => loadValidatedPendingClassClaim());
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionDefinition>();
  const [selectedRegionPage, setSelectedRegionPage] = useState<RegionLearningPageId>('hub');
  const [regionRouteError, setRegionRouteError] = useState<string>();
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion>();
  const [trainingIntent, setTrainingIntent] = useState<TrainingSessionIntent>();

  useEffect(() => {
    function syncPath() {
      setDashboardLocation(`${window.location.pathname}${window.location.hash}`);
    }
    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
    };
  }, []);

  useEffect(() => {
    loadQuestionBankWithDiagnostics()
      .then((loaded) => {
        setQuestions(loaded.questions);
        setCurrentQuestion(undefined);
      })
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadTeachingSnippets()
      .then((snippets) => {
        if (!cancelled) setTeachingSnippets(snippets);
      })
      .catch((error: Error) => {
        if (import.meta.env.DEV) console.warn('[Asterion teaching snippets]', error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadGeneratedPractice()
      .then((items) => {
        if (!cancelled) setGeneratedPractice(items);
      })
      .catch((error: Error) => {
        if (import.meta.env.DEV) console.warn('[Asterion generated practice]', error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function applyHashRoute() {
      const route = parseAsterionHashRoute(window.location.hash);
      if (route.kind !== 'region') return;

      const region = getP3RegionById(route.regionId);
      if (!region) {
        setSelectedRegion(undefined);
        setSelectedRegionPage('hub');
        setCurrentQuestion(undefined);
        setTrainingIntent(undefined);
        setRegionRouteError(`Unknown region "${route.regionId}". Choose a listed P3 region.`);
        setViewMode('regions');
        return;
      }

      setSelectedRegion(region);
      setSelectedRegionPage(route.page);
      setCurrentQuestion(undefined);
      setTrainingIntent(undefined);
      setRegionRouteError(undefined);
      setViewMode('region_hub');
    }

    applyHashRoute();
    window.addEventListener('hashchange', applyHashRoute);
    return () => {
      window.removeEventListener('hashchange', applyHashRoute);
    };
  }, []);

  const trainableQuestions = useMemo(() => questions.filter(isQuestionTrainable), [questions]);
  const worldProgress = useMemo(() => calculateWorldProgress(questions, progress.attempts, P3_ASTRAL_ACADEMY, progress.regionLearning), [progress.attempts, progress.regionLearning, questions]);
  const regionLearningSummaries = useMemo(() => {
    return Object.fromEntries(worldProgress.map((regionProgress) => {
      const regionQuestions = filterTrainableQuestionsForRegion(trainableQuestions, regionProgress.region);
      const regionAttempts = filterMasteryAttemptsForRegion(regionProgress.region, progress.attempts, questions);
      const learningActivityAttempts = progress.learningActivityAttempts.filter((attempt) => attempt.regionId === regionProgress.region.id);
      return [regionProgress.region.id, buildRegionLearningSummary({
        regionProgress,
        learningRecord: progress.regionLearning?.[regionProgress.region.id],
        regionQuestions,
        regionAttempts,
        learningActivityAttempts,
      })];
    }));
  }, [progress.attempts, progress.learningActivityAttempts, progress.regionLearning, questions, trainableQuestions, worldProgress]);
  const avatarGear = useMemo(() => deriveAvatarGear(worldProgress), [worldProgress]);
  const selectedRegionProgress = selectedRegion ? worldProgress.find((item) => item.region.id === selectedRegion.id) : undefined;
  const selectedRegionLearningSummary = selectedRegion ? regionLearningSummaries[selectedRegion.id] : undefined;
  const selectedRegionAccess = useMemo(() => (
    selectedRegion ? getStudentRegionAccess(progress.profile, selectedRegion.id) : undefined
  ), [progress.profile, selectedRegion]);
  const selectedRegionTeachingSnippets = useMemo(() => (
    selectedRegion
      ? getTeachingSnippetsForRegion(teachingSnippets, P3_ASTRAL_ACADEMY.paperFamily, selectedRegion)
      : []
  ), [selectedRegion, teachingSnippets]);
  const selectedRegionGeneratedPractice = useMemo(() => (
    selectedRegion
      ? getGeneratedPracticeForRegion(generatedPractice, selectedRegion.id, P3_ASTRAL_ACADEMY.paperFamily)
      : []
  ), [generatedPractice, selectedRegion]);
  const selectedRegionFieldGuideCompleted = Boolean(selectedRegion && progress.regionLearning?.[selectedRegion.id]?.fieldGuideCompletedAt);
  const avatarLocation = useMemo(
    () => determineAvatarLocation({ progress: worldProgress, selectedRegion, currentQuestion }),
    [worldProgress, selectedRegion, currentQuestion],
  );
  const worldNotice = useMemo(() => {
    const p3 = questions.filter(isP3Question);
    const regionMatches = worldProgress.reduce((sum, item) => sum + item.availableQuestions, 0);
    const imageMetadata = p3.filter((question) => question.questionImageRawPaths.length > 0).length;
    if (questions.length === 0) return 'No questions loaded yet. Check public/assets/exam-bank-data/asterion_question_bank_v1.json and the raw-bank fallback.';
    if (p3.length === 0) return 'Question bank loaded, but no P3 records were found. Check paper_family labels.';
    if (regionMatches === 0) return 'P3 records loaded, but none matched the current regions. Check topic-routing data in Data Health.';
    if (imageMetadata === 0) return 'Questions matched, but images are not loading. Check asset folder layout. Asterion supports /assets/<paper>/..., /assets/questions/p3/<paper>/..., and /assets/questions/<paper>/...';
    return undefined;
  }, [questions, worldProgress]);

  const dashboardRoute = useMemo(
    () => parseDashboardRoute(window.location.pathname, window.location.hash),
    [dashboardLocation],
  );

  function navigatePath(path: string) {
    const basePath = window.location.pathname.startsWith('/teacher') || window.location.pathname.startsWith('/admin')
      ? '/'
      : `${window.location.pathname}${window.location.search}`;
    if (path === '/') {
      window.history.pushState(null, '', basePath);
    } else {
      window.history.pushState(null, '', `${basePath}#${path}`);
    }
    setDashboardLocation(`${window.location.pathname}${window.location.hash}`);
  }

  function activePracticeMode(): PracticeMode {
    return viewMode === 'weak_areas' || viewMode === 'target_topic' || viewMode === 'start' ? viewMode : 'start';
  }

  function practiceModeForTrainingIntent(intent: TrainingSessionIntent | undefined): PracticeMode {
    return intent === 'weak_area_review' ? 'weak_areas' : 'target_topic';
  }

  function chooseNext(nextProgress = progress, mode: PracticeMode = activePracticeMode()) {
    const candidateQuestions = selectedRegion ? filterTrainableQuestionsForRegion(trainableQuestions, selectedRegion) : p3Questions();
    setCurrentQuestion(selectNextQuestion(candidateQuestions, {
      mode,
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
      currentQuestionId: currentQuestion?.id,
    }));
  }

  function p3Questions() {
    return trainableQuestions.filter(isTrainableP3Question);
  }

  function updateRegionHash(regionId: string, page: RegionLearningPageId) {
    const nextHash = regionHashPath(regionId, page);
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }

  function clearRegionHash() {
    if (!window.location.hash.startsWith('#/regions/')) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    setRegionRouteError(undefined);
  }

  function startPractice() {
    clearRegionHash();
    setSelectedRegion(undefined);
    setSelectedRegionPage('hub');
    setTrainingIntent(undefined);
    setViewMode('start');
    setCurrentQuestion(selectNextQuestion(p3Questions(), {
      mode: 'start',
      attempts: progress.attempts,
      topicProfiles: progress.topicProfiles,
    }));
  }

  function enterRegion(region: RegionDefinition) {
    openRegionPage(region, 'hub');
  }

  function openRegionPage(region: RegionDefinition, page: RegionLearningPageId) {
    setSelectedRegion(region);
    setSelectedRegionPage(page);
    setTrainingIntent(undefined);
    setViewMode('region_hub');
    setCurrentQuestion(undefined);
    setRegionRouteError(undefined);
    updateRegionHash(region.id, page);
  }

  function startRegionTraining(region: RegionDefinition, intent: TrainingSessionIntent) {
    const access = getStudentRegionAccess(progress.profile, region.id);
    if (!canStudentUseRegionActivity(access, 'exam_practice')) {
      openRegionPage(region, 'hub');
      return;
    }
    setSelectedRegion(region);
    setTrainingIntent(intent);
    setViewMode('target_topic');
    setCurrentQuestion(selectNextQuestion(filterTrainableQuestionsForRegion(trainableQuestions, region), {
      mode: practiceModeForTrainingIntent(intent),
      attempts: progress.attempts,
      topicProfiles: progress.topicProfiles,
      currentQuestionId: currentQuestion?.id,
    }));
  }

  function challengeGuardian(region: RegionDefinition, question: NormalizedQuestion) {
    const access = getStudentRegionAccess(progress.profile, region.id);
    if (!canStudentUseRegionActivity(access, 'guardian')) {
      openRegionPage(region, 'hub');
      return;
    }
    setSelectedRegion(region);
    setTrainingIntent(undefined);
    setViewMode('guardian');
    setCurrentQuestion(question);
  }

  function returnToMap() {
    clearRegionHash();
    setViewMode('map');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function openRegions() {
    clearRegionHash();
    setViewMode('regions');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function openProfile() {
    clearRegionHash();
    setViewMode('profile');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function openClassHall() {
    clearRegionHash();
    setSelectedRegion(undefined);
    setSelectedRegionPage('hub');
    setViewMode('class_hall');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function reviewWeakAreas(nextProgress = progress) {
    clearRegionHash();
    setSelectedRegion(undefined);
    setSelectedRegionPage('hub');
    setTrainingIntent(undefined);
    setViewMode('weak_areas');
    setCurrentQuestion(selectNextQuestion(p3Questions(), {
      mode: 'weak_areas',
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
    }));
  }

  function handleStudentClassClaim(claim: StudentClaimState) {
    const validatedClaim = validatePendingClassClaim(claim);
    if (!validatedClaim) {
      clearPendingClassClaim();
      setStudentClassClaim(undefined);
      return;
    }
    setStudentClassClaim(savePendingClassClaim(validatedClaim));
  }

  function restartStudentClassClaim() {
    clearPendingClassClaim();
    setStudentClassClaim(undefined);
  }

  function saveClaimedStudentProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    const nextProgress = progressAdapter.saveProfile(profile);
    clearPendingClassClaim();
    setStudentClassClaim(undefined);
    setProgress(nextProgress);
  }

  if (dashboardRoute.kind === 'teacher' && !runtimeConfig.dashboardDemoEnabled) {
    return <DisabledDashboardRoute routeKind="teacher" onNavigatePath={navigatePath} />;
  }

  if (dashboardRoute.kind === 'admin' && !runtimeConfig.dashboardDemoEnabled) {
    return <DisabledDashboardRoute routeKind="admin" onNavigatePath={navigatePath} />;
  }

  if (dashboardRoute.kind === 'teacher') {
    return <TeacherDashboard classId={dashboardRoute.classId} page={dashboardRoute.page} regionId={dashboardRoute.regionId} onNavigatePath={navigatePath} />;
  }

  if (dashboardRoute.kind === 'admin') {
    return <AdminDashboard onNavigatePath={navigatePath} />;
  }

  if (!progress.profile) {
    return (
      <main className="app-shell onboarding-shell">
        <TwinklingStarfield />
        <section className="intro-panel academy-admission">
          <div className="intro-copy">
            <span className="mode-pill">CAIE 9709 · Paper 3 Astral Academy</span>
            <h1>Asterion</h1>
          </div>
          <div className="asterion-emblem" role="img" aria-label="Golden Asterion A emblem" data-testid="asterion-emblem">
            <span className="emblem-orbit" aria-hidden="true">
              <span className="emblem-orbit-star" />
            </span>
            <svg className="asterion-emblem-mark" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
              <defs>
                <radialGradient id="emblemGlow" cx="50%" cy="42%" r="62%">
                  <stop offset="0%" stopColor="#fff7be" />
                  <stop offset="48%" stopColor="#efb536" />
                  <stop offset="100%" stopColor="#7c4510" />
                </radialGradient>
                <linearGradient id="emblemGold" x1="64" x2="174" y1="54" y2="184" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fff2a8" />
                  <stop offset="54%" stopColor="#f0b638" />
                  <stop offset="100%" stopColor="#a76018" />
                </linearGradient>
              </defs>
              <circle className="emblem-aura" cx="120" cy="120" r="94" />
              <circle className="emblem-ring" cx="120" cy="120" r="78" />
              <path className="emblem-cross-orbit" d="M44 132c35-43 72-65 111-66 26-1 49 8 69 28" />
              <path className="emblem-cross-orbit" d="M38 152c38 21 78 27 121 17 25-6 46-19 63-39" />
              <text className="emblem-letter" x="120" y="158" textAnchor="middle">A</text>
            </svg>
          </div>
          <div className="onboarding-briefing">
            <strong>Academy charter</strong>
            <span>Your quest begins here.</span>
            <span>Restore the P3 regions, collect evidence from real practice, and travel toward the A*.</span>
            <span>One region at a time. One skill at a time.</span>
          </div>
        </section>
        {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}
        {studentClassClaim ? (
          <ProfileForm
            initialProfile={{
              realName: studentClassClaim.displayName ?? '',
              classGroup: studentClassClaim.className ?? '',
              teacherName: studentClassClaim.teacherName ?? '',
              avatarName: '',
              classClaim: studentClassClaim,
            }}
            lockedClassFields
            onRestartClaim={restartStudentClassClaim}
            onSave={(profile) => saveClaimedStudentProfile({
              ...profile,
              classClaim: studentClassClaim,
            })}
          />
        ) : (
          <ClassCodeClaimForm onClaimed={handleStudentClassClaim} />
        )}
      </main>
    );
  }

  return (
    <main className={`app-shell app-view-${viewMode}`}>
      <TwinklingStarfield />
      <header className="topbar">
        <div>
          <span className="mode-pill">Classroom practice mode</span>
          <h1>Asterion</h1>
        </div>
        <nav>
          <button className={viewMode === 'map' ? 'active' : ''} type="button" onClick={returnToMap}>World Map</button>
          <button className={viewMode === 'regions' || viewMode === 'region_hub' ? 'active' : ''} type="button" onClick={openRegions}>Regions</button>
          <button className={viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'guardian' ? 'active' : ''} type="button" onClick={startPractice}>Start Practice</button>
          <button className={viewMode === 'class_hall' ? 'active' : ''} type="button" onClick={openClassHall}><UsersRound size={16} /> Class Hall</button>
          <button className={viewMode === 'profile' ? 'active' : ''} type="button" onClick={openProfile}>Profile</button>
        </nav>
      </header>

      {loadError ? <div className="notice">Question bank not loaded: {loadError}</div> : null}
      {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}
      {regionRouteError ? <div className="notice">{regionRouteError}</div> : null}

      {viewMode === 'map' ? (
        <P3AstralAcademy
          world={P3_ASTRAL_ACADEMY}
          progress={worldProgress}
          avatarName={progress.profile.avatarName}
          avatar={progress.avatar}
          avatarLocation={avatarLocation}
          regionLearningSummaries={regionLearningSummaries}
          notice={worldNotice}
          onTrain={enterRegion}
        />
      ) : null}

      {viewMode === 'regions' ? (
        <AstralRegionLedger progress={worldProgress} regionLearningSummaries={regionLearningSummaries} onTrain={enterRegion} />
      ) : null}

      {viewMode === 'region_hub' && selectedRegion && selectedRegionProgress && selectedRegionLearningSummary ? (
        <RegionHub
          regionProgress={selectedRegionProgress}
          fieldGuide={getRegionFieldGuide(selectedRegion)}
          fieldGuideCompleted={selectedRegionFieldGuideCompleted}
          teachingSnippets={selectedRegionTeachingSnippets}
          generatedPractice={selectedRegionGeneratedPractice}
          learningActivityAttempts={progress.learningActivityAttempts.filter((attempt) => attempt.regionId === selectedRegion.id)}
          profileId={progress.profile.id}
          summary={selectedRegionLearningSummary}
          studentRegionAccess={selectedRegionAccess}
          onCompleteFieldGuide={() => setProgress(progressAdapter.completeRegionFieldGuide(selectedRegion.id))}
          onLearningActivityAttempt={(attempt: LearningActivityAttempt) => {
            const activity = attempt.activityType === 'quick_check' ? 'quick_check' : 'warm_up';
            if (!canStudentUseRegionActivity(selectedRegionAccess, activity)) return;
            setProgress(progressAdapter.addLearningActivityAttempt(attempt));
          }}
          onStartTraining={(intent) => startRegionTraining(selectedRegion, intent)}
          onChallengeGuardian={(question) => challengeGuardian(selectedRegion, question)}
          activePage={selectedRegionPage}
          onNavigatePage={(page) => openRegionPage(selectedRegion, page)}
          onReturnToMap={returnToMap}
        />
      ) : null}

      {viewMode === 'profile' ? (
        <AvatarBuilder
          profile={progress.profile}
          avatar={progress.avatar}
          avatarGear={avatarGear}
          attempts={progress.attempts}
          questions={trainableQuestions}
          regionLearning={progress.regionLearning}
          regionProgress={worldProgress}
          onAvatarChange={(avatar) => setProgress(progressAdapter.saveAvatarSettings(avatar))}
        />
      ) : null}

      {viewMode === 'class_hall' ? <ClassHall /> : null}

      {viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'weak_areas' || viewMode === 'guardian' ? (
        <PracticeView
          question={currentQuestion}
          progress={progress}
          avatarName={progress.profile.avatarName}
          avatar={progress.avatar}
          regionProgress={worldProgress}
          avatarLocation={avatarLocation}
          worldName={selectedRegion ? P3_WORLD_NAME : undefined}
          selectedRegion={selectedRegion}
          selectedRegionRank={selectedRegionProgress?.rank}
          regionLearningPhase={viewMode === 'guardian' ? 'guardian' : selectedRegion ? 'training' : undefined}
          sessionIntent={selectedRegion && viewMode === 'target_topic' ? trainingIntent ?? selectedRegionLearningSummary?.trainingSession.intent : undefined}
          sessionReason={viewMode === 'guardian'
            ? 'You are challenging the Region Guardian because your saved local evidence unlocked this check.'
            : selectedRegion ? selectedRegionLearningSummary?.trainingSession.reason : undefined}
          guardianPassThreshold={viewMode === 'guardian' ? GUARDIAN_PASS_SCORE_RATIO : undefined}
          progressionBlockedReason={selectedRegion && !canStudentUseRegionActivity(selectedRegionAccess, viewMode === 'guardian' ? 'guardian' : 'exam_practice')
            ? lockedRegionMessage(selectedRegionAccess)
            : undefined}
          onAttempt={(attempt: Attempt) => {
            if (selectedRegion && !canStudentUseRegionActivity(selectedRegionAccess, viewMode === 'guardian' ? 'guardian' : 'exam_practice')) return;
            const evidenceAttempt: Attempt = {
              ...attempt,
              masteryEligible: currentQuestion?.eligibility?.masteryEligible.eligible,
              guardianEligible: currentQuestion?.eligibility?.guardianEligible.eligible,
              masteryEvidenceReadiness: currentQuestion?.masteryReadiness?.status,
              masteryEvidenceReasonCodes: currentQuestion?.masteryReadiness?.reasonCodes,
              validatedRegionId: currentQuestion?.routeEvidence?.validatedRegionId,
              displayRegionId: currentQuestion?.routeEvidence?.displayRegionId,
            };
            const nextProgress = progressAdapter.addAttempt(evidenceAttempt);
            if (viewMode === 'guardian' && selectedRegion) {
              const scoreRatio = typeof evidenceAttempt.scoreRatio === 'number'
                ? evidenceAttempt.scoreRatio
                : typeof evidenceAttempt.marksAvailable === 'number' && evidenceAttempt.marksAvailable > 0
                  ? evidenceAttempt.marksEarned / evidenceAttempt.marksAvailable
                  : 0;
              setProgress(progressAdapter.recordRegionGuardianAttempt({
                regionId: selectedRegion.id,
                questionId: evidenceAttempt.questionId,
                attemptId: evidenceAttempt.id,
                passed: scoreRatio >= GUARDIAN_PASS_SCORE_RATIO,
                attemptedAt: evidenceAttempt.attemptedAt,
              }));
              return;
            }
            setProgress(nextProgress);
          }}
          onIssue={(questionId: string, issueType: IssueType, note?: string) => {
            setProgress(progressAdapter.addIssueReport({ id: createId('issue'), profileId: progress.profile?.id, questionId, issueType, note, createdAt: new Date().toISOString(), worldName: selectedRegion ? P3_WORLD_NAME : undefined, regionName: selectedRegion?.name }));
          }}
          onReturnToMap={returnToMap}
          onReviewWeak={() => reviewWeakAreas()}
          onContinuePractice={() => {
            if (viewMode === 'guardian' && selectedRegion) {
              enterRegion(selectedRegion);
              return;
            }
            chooseNext(progress, selectedRegion ? practiceModeForTrainingIntent(trainingIntent) : activePracticeMode());
          }}
          continuePracticeLabel={viewMode === 'guardian' ? 'Return to region hub' : undefined}
        />
      ) : null}

    </main>
  );
}
