import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { RoleGate } from './components/auth/RoleGate';
import { ClassCodeClaimForm } from './components/onboarding/ClassCodeClaimForm';
import { ProfileForm } from './components/onboarding/ProfileForm';
import { TwinklingStarfield } from './components/shared/TwinklingStarfield';
import { AstralRegionLedger, P3AstralAcademy } from './components/world/P3AstralAcademy';
import { getRegionFieldGuide } from './data/regionFieldGuides';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { deriveAvatarGear } from './lib/avatarGear';
import { determineAvatarLocation } from './lib/avatarLocation';
import { dashboardRouteEnabled, parseDashboardRoute } from './lib/appRoutes';
import { resolveRuntimeConfig, type AsterionRuntimeConfig } from './lib/appConfig';
import { canStudentUseRegionActivity, getStudentRegionAccess, lockedRegionMessage } from './lib/classRegionAccess';
import { buildLocalClassHallSnapshot } from './lib/classHall';
import { getGeneratedPracticeForRegion, loadGeneratedPractice, type GeneratedPracticeItem } from './lib/generatedPractice';
import { loadQuestionBankWithDiagnostics } from './lib/loadQuestionBank';
import { createId, getProgressStorageAdapter } from './lib/progressStore';
import { filterTrainableQuestionsForRegion, isQuestionTrainable, isTrainableP3Question } from './lib/questionTraining';
import { buildRegionLearningSummary, GUARDIAN_PASS_SCORE_RATIO } from './lib/regionLearning';
import { calculateWorldProgress, filterMasteryAttemptsForRegion } from './lib/regionProgress';
import { validatePendingClassClaim } from './lib/dashboardMockService';
import { recordHostedProgressEvent, type HostedProgressActivityType, type HostedProgressEventPayload, type HostedProgressEventType } from './lib/supabaseProgressEventService';
import {
  getP3RegionById,
  parseAsterionHashRoute,
  regionHashPath,
  type RegionLearningPageId,
} from './lib/regionRoutes';
import { clearPendingClassClaim, loadPendingClassClaim, savePendingClassClaim } from './lib/studentClassClaimStore';
import { useStudentClassroomContext, type StudentClassroomContext } from './lib/studentClassroomService';
import { recoverSupabaseAuthRedirect } from './lib/supabaseAuthRedirect';
import { getTeachingSnippetsForRegion, loadTeachingSnippets, type TeachingSnippet } from './lib/teachingSnippets';
import { isP3Question, P3_ASTRAL_ACADEMY, P3_WORLD_NAME } from './lib/worldMap';
import type { Attempt, IssueType, LearningActivityAttempt, NormalizedQuestion, RegionDefinition, StoredProgress, StudentClaimState, StudentProfile, TrainingSessionIntent } from './types';

type ViewMode = PracticeMode | 'map' | 'regions' | 'region_hub' | 'guardian' | 'profile' | 'class_hall';

const TeacherDashboard = lazy(() => import('./components/dashboard/TeacherDashboard').then((module) => ({ default: module.TeacherDashboard })));
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AvatarBuilder = lazy(() => import('./components/profile/AvatarBuilder').then((module) => ({ default: module.AvatarBuilder })));
const ClassHall = lazy(() => import('./components/classHall/ClassHall').then((module) => ({ default: module.ClassHall })));
const PracticeView = lazy(() => import('./components/practice/PracticeView').then((module) => ({ default: module.PracticeView })));
const RegionHub = lazy(() => import('./components/world/RegionHub').then((module) => ({ default: module.RegionHub })));

function loadValidatedPendingClassClaim(runtimeConfig: AsterionRuntimeConfig): StudentClaimState | undefined {
  if (runtimeConfig.profile.name === 'classroom-pilot') {
    clearPendingClassClaim();
    return undefined;
  }
  const pendingClaim = loadPendingClassClaim();
  const validatedClaim = validatePendingClassClaim(pendingClaim);
  if (pendingClaim && !validatedClaim) clearPendingClassClaim();
  return validatedClaim;
}

function studentPracticeModeLabel(config: AsterionRuntimeConfig): string {
  return config.profile.name === 'classroom-pilot' ? 'Classroom practice mode' : 'Browser-local practice mode';
}

function onboardingProgressMessage(config: AsterionRuntimeConfig): string {
  return config.profile.name === 'classroom-pilot'
    ? 'Your class membership and teacher summaries are hosted. Raw practice work stays on this browser.'
    : 'Progress is saved on this browser/device only. Clearing site data starts a fresh local profile.';
}

function DisabledDashboardRoute({ routeKind, runtimeConfig, onNavigatePath }: { routeKind: 'teacher' | 'admin' | 'dashboard'; runtimeConfig: AsterionRuntimeConfig; onNavigatePath: (path: string) => void }) {
  const classroomPilotActive = runtimeConfig.profile.name === 'classroom-pilot';
  const routeLabel = routeKind === 'teacher'
    ? 'teacher dashboard'
    : routeKind === 'admin'
      ? 'admin console'
      : 'dashboard route';
  return (
    <main className="app-shell onboarding-shell">
      <TwinklingStarfield />
      <section className="intro-panel academy-admission">
        <div className="intro-copy">
          <span className="mode-pill">Demo dashboard disabled</span>
          <h1>Asterion</h1>
          <p>
            {classroomPilotActive
              ? `The ${routeLabel} is not available through this dashboard alias.`
              : `The ${routeLabel} is private review-build functionality and is not available in this student pilot build.`}
          </p>
        </div>
        <div className="onboarding-briefing">
          <strong>Student app active</strong>
          <span>{classroomPilotActive ? 'Normal Paper 3 practice remains available. Hosted classroom authority uses Supabase, not this browser.' : 'Normal Paper 3 practice still runs locally without Supabase or hosted classroom access.'}</span>
          <span>{classroomPilotActive ? 'Use #/teacher or #/admin for hosted dashboard entry points after sign-in and role bootstrap.' : 'Set VITE_ASTERION_DASHBOARD_DEMO=enabled for a mock demo, or VITE_ASTERION_DASHBOARD_DATA_SOURCE=supabase for the hosted Supabase dashboard adapter.'}</span>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigatePath('/')}>
          Student app
        </button>
      </section>
    </main>
  );
}

function DashboardRouteFallback() {
  return (
    <main className="app-shell onboarding-shell" aria-busy="true">
      <TwinklingStarfield />
      <section className="intro-panel academy-admission">
        <div className="intro-copy">
          <span className="mode-pill">Dashboard loading</span>
          <h1>Asterion</h1>
          <p>Loading dashboard route...</p>
        </div>
      </section>
    </main>
  );
}

function StudentViewFallback({ label }: { label: string }) {
  return (
    <section className="region-panel" aria-busy="true">
      <span className="mode-pill">{label}</span>
      <p>Loading...</p>
    </section>
  );
}

function HostedStudentGateMessage({
  state,
}: {
  state: Exclude<ReturnType<typeof useStudentClassroomContext>[0], { status: 'ready' }>;
}) {
  if (state.status === 'loading') {
    return <div className="notice" role="status">Checking hosted classroom membership...</div>;
  }
  if (state.status === 'signed-out') {
    return <div className="notice">Sign in and claim your hosted roster slot before entering the classroom pilot.</div>;
  }
  if (state.status === 'missing-membership') {
    return <div className="notice">{state.message}</div>;
  }
  return <div className="notice">{state.error}{state.detail ? ` ${state.detail}` : ''}</div>;
}

function hostedSyncWarningText(error: string): string {
  return `Classroom hosted activity could not sync to Supabase. Local practice is saved in this browser, but teachers will not see this unsynced activity. ${error}`;
}

function hostedInitialProfile(context: StudentClassroomContext, avatarName = ''): Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    realName: context.membership.rosterName || context.studentProfile.displayName,
    classGroup: context.classRecord.name,
    teacherName: context.teacher.displayName,
    avatarName,
    classClaim: context.claim,
  };
}

export default function App() {
  const runtimeConfig = useMemo(() => resolveRuntimeConfig(), []);
  const progressAdapter = useMemo(() => getProgressStorageAdapter(), []);
  const hostedStudentRequired = runtimeConfig.profile.name === 'classroom-pilot';
  const [hostedClassroomReloadKey, setHostedClassroomReloadKey] = useState(0);
  const [hostedClassroomState, refreshHostedClassroomContext] = useStudentClassroomContext({
    enabled: hostedStudentRequired,
    reloadKey: hostedClassroomReloadKey,
  });
  const [dashboardLocation, setDashboardLocation] = useState(() => `${window.location.pathname}${window.location.hash}`);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [teachingSnippets, setTeachingSnippets] = useState<TeachingSnippet[]>([]);
  const [generatedPractice, setGeneratedPractice] = useState<GeneratedPracticeItem[]>([]);
  const [progress, setProgress] = useState<StoredProgress>(() => progressAdapter.loadProgressContext());
  const [studentClassClaim, setStudentClassClaim] = useState<StudentClaimState | undefined>(() => loadValidatedPendingClassClaim(runtimeConfig));
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionDefinition>();
  const [selectedRegionPage, setSelectedRegionPage] = useState<RegionLearningPageId>('hub');
  const [regionRouteError, setRegionRouteError] = useState<string>();
  const [hostedSyncWarning, setHostedSyncWarning] = useState<string>();
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
    let cancelled = false;
    void recoverSupabaseAuthRedirect().then((intendedRoute) => {
      if (!cancelled && intendedRoute) {
        setDashboardLocation(`${window.location.pathname}${window.location.hash}`);
      }
    });
    return () => {
      cancelled = true;
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
  const hostedClassroomContext = hostedClassroomState.status === 'ready' ? hostedClassroomState.context : undefined;
  const hostedRegionAccess = hostedClassroomContext?.regionAccess;
  const selectedRegionAccess = useMemo(() => (
    selectedRegion ? getStudentRegionAccess(progress.profile, selectedRegion.id, hostedRegionAccess) : undefined
  ), [hostedRegionAccess, progress.profile, selectedRegion]);
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
  const localClassHallSnapshot = useMemo(() => (
    progress.profile
      ? buildLocalClassHallSnapshot({
        profile: progress.profile,
        avatar: progress.avatar,
        avatarGear,
      })
      : undefined
  ), [avatarGear, progress.avatar, progress.profile]);
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
    const access = getStudentRegionAccess(progress.profile, region.id, hostedRegionAccess);
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
    const access = getStudentRegionAccess(progress.profile, region.id, hostedRegionAccess);
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
    if (hostedStudentRequired) {
      if (claim.status !== 'claimed') {
        clearPendingClassClaim();
        setStudentClassClaim(undefined);
        return;
      }
      setStudentClassClaim(savePendingClassClaim(claim));
      setHostedClassroomReloadKey((value) => value + 1);
      refreshHostedClassroomContext();
      return;
    }

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

  function persistProgressAfterMeaningfulEvent(nextProgress: StoredProgress) {
    setProgress(nextProgress);
  }

  function recordHostedClassroomActivity(input: {
    regionId: string;
    activityType: HostedProgressActivityType;
    eventType: HostedProgressEventType;
    contentId?: string;
    questionId?: string;
    skillId?: string;
    eventPayload?: HostedProgressEventPayload;
  }) {
    if (!runtimeConfig.profile.hostedProgressSyncEnabled || !hostedClassroomContext) {
      return;
    }

    void recordHostedProgressEvent({
      classroomContext: hostedClassroomContext,
      ...input,
    }).then((result) => {
      if (result.status === 'synced') {
        setHostedSyncWarning(undefined);
      } else if (result.status === 'failed') {
        setHostedSyncWarning(hostedSyncWarningText(result.error));
      }
    });
  }

  function saveClaimedStudentProfile(profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    if (hostedStudentRequired && hostedClassroomContext) {
      const nextProgress = progressAdapter.saveProfile({
        ...profile,
        realName: hostedClassroomContext.membership.rosterName,
        classGroup: hostedClassroomContext.classRecord.name,
        teacherName: hostedClassroomContext.teacher.displayName,
        classClaim: hostedClassroomContext.claim,
      });
      clearPendingClassClaim();
      setStudentClassClaim(undefined);
      persistProgressAfterMeaningfulEvent(nextProgress);
      return;
    }

    const nextProgress = progressAdapter.saveProfile(profile);
    clearPendingClassClaim();
    setStudentClassClaim(undefined);
    persistProgressAfterMeaningfulEvent(nextProgress);
  }

  if (dashboardRoute.kind === 'teacher' && !dashboardRouteEnabled(dashboardRoute, runtimeConfig)) {
    return <DisabledDashboardRoute routeKind="teacher" runtimeConfig={runtimeConfig} onNavigatePath={navigatePath} />;
  }

  if (dashboardRoute.kind === 'admin' && !dashboardRouteEnabled(dashboardRoute, runtimeConfig)) {
    return <DisabledDashboardRoute routeKind="admin" runtimeConfig={runtimeConfig} onNavigatePath={navigatePath} />;
  }

  if (dashboardRoute.kind === 'dashboard') {
    return <DisabledDashboardRoute routeKind="dashboard" runtimeConfig={runtimeConfig} onNavigatePath={navigatePath} />;
  }

  if (dashboardRoute.kind === 'teacher') {
    if (runtimeConfig.dashboardDataSource === 'supabase') {
      return (
        <Suspense fallback={<DashboardRouteFallback />}>
          <RoleGate requiredRole="teacher" onNavigatePath={navigatePath}>
            {(hostedRoleContext) => (
              <TeacherDashboard
                classId={dashboardRoute.classId}
                page={dashboardRoute.page}
                regionId={dashboardRoute.regionId}
                hostedRoleContext={hostedRoleContext}
                onNavigatePath={navigatePath}
              />
            )}
          </RoleGate>
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<DashboardRouteFallback />}>
        <TeacherDashboard classId={dashboardRoute.classId} page={dashboardRoute.page} regionId={dashboardRoute.regionId} onNavigatePath={navigatePath} />
      </Suspense>
    );
  }

  if (dashboardRoute.kind === 'admin') {
    if (runtimeConfig.dashboardDataSource === 'supabase') {
      return (
        <Suspense fallback={<DashboardRouteFallback />}>
          <RoleGate requiredRole="admin" onNavigatePath={navigatePath}>
            {(hostedRoleContext) => (
              <AdminDashboard hostedRoleContext={hostedRoleContext} onNavigatePath={navigatePath} />
            )}
          </RoleGate>
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<DashboardRouteFallback />}>
        <AdminDashboard onNavigatePath={navigatePath} />
      </Suspense>
    );
  }

  if (hostedStudentRequired && hostedClassroomState.status !== 'ready') {
    return (
      <main className="app-shell onboarding-shell">
        <TwinklingStarfield />
        <section className="intro-panel academy-admission">
          <div className="intro-copy">
            <span className="mode-pill">CAIE 9709 · Paper 3 Astral Academy</span>
            <h1>Asterion</h1>
          </div>
          <div className="onboarding-briefing">
            <strong>Hosted classroom access</strong>
            <span>Class membership, teacher, and region access are checked through Supabase before the map opens.</span>
            <span>Existing browser profiles cannot enter without a currently claimed hosted roster slot.</span>
            <span>{onboardingProgressMessage(runtimeConfig)}</span>
          </div>
        </section>
        <HostedStudentGateMessage state={hostedClassroomState} />
        {runtimeConfig.profileNotice ? <div className="notice">{runtimeConfig.profileNotice}</div> : null}
        {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}
        <ClassCodeClaimForm onClaimed={handleStudentClassClaim} />
      </main>
    );
  }

  if (!progress.profile) {
    const hostedInitial = hostedClassroomContext ? hostedInitialProfile(hostedClassroomContext, studentClassClaim?.displayName === hostedClassroomContext.membership.rosterName ? '' : '') : undefined;
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
            <span>{onboardingProgressMessage(runtimeConfig)}</span>
            <span>One region at a time. One skill at a time.</span>
          </div>
          <ol className="first-run-flow" aria-label="First-run flow">
            <li><strong>1</strong><span>Claim class slot</span></li>
            <li><strong>2</strong><span>Enter P3 map</span></li>
            <li><strong>3</strong><span>Read guide, practise, self-mark</span></li>
          </ol>
        </section>
        {runtimeConfig.profileNotice ? <div className="notice">{runtimeConfig.profileNotice}</div> : null}
        {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}
        {hostedClassroomContext ? (
          <ProfileForm
            initialProfile={hostedInitial}
            lockedClassFields
            onSave={(profile) => saveClaimedStudentProfile({
              ...profile,
              classClaim: hostedClassroomContext.claim,
            })}
          />
        ) : studentClassClaim ? (
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
          <span className="mode-pill">{studentPracticeModeLabel(runtimeConfig)}</span>
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
      {runtimeConfig.profileNotice ? <div className="notice">{runtimeConfig.profileNotice}</div> : null}
      {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}
      {regionRouteError ? <div className="notice">{regionRouteError}</div> : null}
      {hostedSyncWarning ? <div className="classroom-sync-warning" role="status">{hostedSyncWarning}</div> : null}

      {viewMode === 'map' ? (
        <P3AstralAcademy
          world={P3_ASTRAL_ACADEMY}
          progress={worldProgress}
          avatarName={progress.profile.avatarName}
          avatar={progress.avatar}
          avatarLocation={avatarLocation}
          regionLearningSummaries={regionLearningSummaries}
          regionAccess={hostedRegionAccess}
          notice={worldNotice}
          onTrain={enterRegion}
        />
      ) : null}

      {viewMode === 'regions' ? (
        <AstralRegionLedger progress={worldProgress} regionLearningSummaries={regionLearningSummaries} regionAccess={hostedRegionAccess} onTrain={enterRegion} />
      ) : null}

      {viewMode === 'region_hub' && selectedRegion && selectedRegionProgress && selectedRegionLearningSummary ? (
        <Suspense fallback={<StudentViewFallback label="Region loading" />}>
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
            onCompleteFieldGuide={() => {
              persistProgressAfterMeaningfulEvent(progressAdapter.completeRegionFieldGuide(selectedRegion.id));
              recordHostedClassroomActivity({
                regionId: selectedRegion.id,
                activityType: 'field_guide',
                eventType: 'field_guide_completed',
                eventPayload: { completed: true },
              });
            }}
            onLearningActivityAttempt={(attempt: LearningActivityAttempt) => {
              const activity = attempt.activityType === 'quick_check' ? 'quick_check' : 'warm_up';
              if (!canStudentUseRegionActivity(selectedRegionAccess, activity)) return;
              persistProgressAfterMeaningfulEvent(progressAdapter.addLearningActivityAttempt(attempt));
              recordHostedClassroomActivity({
                regionId: selectedRegion.id,
                activityType: attempt.activityType,
                eventType: attempt.activityType === 'quick_check' ? 'quick_check_completed' : 'warm_up_completed',
                contentId: attempt.activityId,
                skillId: attempt.skillTargetId,
                eventPayload: {
                  outcome: attempt.outcome,
                  completed: true,
                },
              });
            }}
            onStartTraining={(intent) => startRegionTraining(selectedRegion, intent)}
            onChallengeGuardian={(question) => challengeGuardian(selectedRegion, question)}
            activePage={selectedRegionPage}
            onNavigatePage={(page) => openRegionPage(selectedRegion, page)}
            onReturnToMap={returnToMap}
          />
        </Suspense>
      ) : null}

      {viewMode === 'profile' ? (
        <Suspense fallback={<StudentViewFallback label="Profile loading" />}>
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
        </Suspense>
      ) : null}

      {viewMode === 'class_hall' ? (
        <Suspense fallback={<StudentViewFallback label="Class Hall loading" />}>
          <ClassHall currentStudentAvatar={localClassHallSnapshot} />
        </Suspense>
      ) : null}

      {viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'weak_areas' || viewMode === 'guardian' ? (
        <Suspense fallback={<StudentViewFallback label="Practice loading" />}>
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
                const passed = scoreRatio >= GUARDIAN_PASS_SCORE_RATIO;
                persistProgressAfterMeaningfulEvent(progressAdapter.recordRegionGuardianAttempt({
                  regionId: selectedRegion.id,
                  questionId: evidenceAttempt.questionId,
                  attemptId: evidenceAttempt.id,
                  passed,
                  attemptedAt: evidenceAttempt.attemptedAt,
                }));
                recordHostedClassroomActivity({
                  regionId: selectedRegion.id,
                  activityType: 'guardian',
                  eventType: passed ? 'guardian_completed' : 'guardian_attempted',
                  questionId: evidenceAttempt.questionId,
                  eventPayload: {
                    scoreRatio,
                    marksEarned: evidenceAttempt.marksEarned,
                    marksAvailable: evidenceAttempt.marksAvailable,
                    durationSeconds: evidenceAttempt.timeSpentSeconds,
                    passed,
                  },
                });
                return;
              }
              persistProgressAfterMeaningfulEvent(nextProgress);
              if (selectedRegion) {
                const scoreRatio = typeof evidenceAttempt.scoreRatio === 'number'
                  ? evidenceAttempt.scoreRatio
                  : typeof evidenceAttempt.marksAvailable === 'number' && evidenceAttempt.marksAvailable > 0
                    ? evidenceAttempt.marksEarned / evidenceAttempt.marksAvailable
                    : undefined;
                recordHostedClassroomActivity({
                  regionId: selectedRegion.id,
                  activityType: 'exam_practice',
                  eventType: 'practice_attempt_saved',
                  questionId: evidenceAttempt.questionId,
                  eventPayload: {
                    scoreRatio,
                    marksEarned: evidenceAttempt.marksEarned,
                    marksAvailable: evidenceAttempt.marksAvailable,
                    durationSeconds: evidenceAttempt.timeSpentSeconds,
                  },
                });
              }
            }}
            onIssue={(questionId: string, issueType: IssueType, note?: string) => {
              persistProgressAfterMeaningfulEvent(progressAdapter.addIssueReport({ id: createId('issue'), profileId: progress.profile?.id, questionId, issueType, note, createdAt: new Date().toISOString(), worldName: selectedRegion ? P3_WORLD_NAME : undefined, regionName: selectedRegion?.name }));
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
        </Suspense>
      ) : null}

    </main>
  );
}
