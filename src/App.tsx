import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { CourseDashboard } from './components/course/CourseDashboard';
import { CourseSelector } from './components/course/CourseSelector';
import { TopicHub } from './components/study/TopicHub';
import { TopicIndex } from './components/study/TopicIndex';
import { COURSES, getCourseBySlug, isCourseSlug, P3_COURSE_ID, type CourseMetadata } from './data/courses';
import { getRegionFieldGuide } from './data/regionFieldGuides';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { EXAM_TRAINING_PRACTICE_LABELS, type ExamTrainingPracticeMode } from './lib/examTrainingDashboard';
import { getGeneratedPracticeForRegion, loadGeneratedPractice, type GeneratedPracticeItem } from './lib/generatedPractice';
import { loadQuestionBankWithDiagnostics } from './lib/loadQuestionBank';
import { createId, getProgressStorageAdapter } from './lib/progressStore';
import { filterTrainableQuestionsForRegion, isQuestionTrainable, isTrainableP3Question } from './lib/questionTraining';
import { buildRegionLearningSummary } from './lib/regionLearning';
import { calculateWorldProgress, filterMasteryAttemptsForRegion } from './lib/regionProgress';
import { getTeachingSnippetsForRegion, loadTeachingSnippets, type TeachingSnippet } from './lib/teachingSnippets';
import {
  currentStaticBasePath,
  displayRegionForTopic,
  p3TopicPath,
  regionForStudyTopic,
  stripStaticBasePath,
  STUDY_ROUTE_ROOTS,
  studyTopicForRegionId,
  studyTopicForSlug,
  type StudyTopic,
  type TopicStudyPage,
} from './lib/topicStudy';
import { P3_ASTRAL_ACADEMY } from './lib/worldMap';
import type { Attempt, IssueType, LearningActivityAttempt, NormalizedQuestion, RegionDefinition, StoredProgress, StudentProfile, TrainingSessionIntent } from './types';

type ViewMode = 'course_selection' | 'course_dashboard' | 'index' | 'topic' | 'exam_training_dashboard' | 'start' | 'target_topic' | 'weak_areas';

type StudyRoute =
  | { kind: 'course-selection' }
  | { kind: 'course-dashboard'; course: CourseMetadata }
  | { kind: 'index' }
  | { kind: 'topic'; course: CourseMetadata; topic: StudyTopic; page: TopicStudyPage }
  | { kind: 'exam-training'; course: CourseMetadata; topic?: StudyTopic };

const ExamTrainingDashboard = lazy(() => import('./components/world/regionHub/ExamTrainingDashboard').then((module) => ({ default: module.ExamTrainingDashboard })));
const PracticeView = lazy(() => import('./components/practice/PracticeView').then((module) => ({ default: module.PracticeView })));
const P3_COURSE = COURSES.find((course) => course.id === P3_COURSE_ID)!;

function recoverGithubPagesRedirect() {
  if (typeof window === 'undefined') return;
  const redirect = window.sessionStorage.getItem('asterion.spa.redirect');
  if (!redirect) return;
  window.sessionStorage.removeItem('asterion.spa.redirect');
  const target = new URL(redirect, window.location.origin);
  if (target.origin !== window.location.origin) return;
  window.history.replaceState(null, '', `${target.pathname}${target.search}${target.hash}`);
}

recoverGithubPagesRedirect();

function parseTopicPage(segment: string | undefined): TopicStudyPage {
  if (segment === 'field-guide') return 'field-guide';
  if (segment === 'skill-practice' || segment === 'quick-check' || segment === 'warm-up') return 'skill-practice';
  return 'hub';
}

function routePathFromLocation(pathname: string, hash: string): string {
  if (hash.startsWith('#/')) return hash.slice(1);
  return stripStaticBasePath(pathname);
}

function parseStudyRoute(pathname: string, hash: string): StudyRoute {
  const routePath = routePathFromLocation(pathname, hash);
  const [root, ...segments] = routePath.split('/').filter(Boolean);

  if (!root) return { kind: 'course-selection' };

  if (isCourseSlug(root)) {
    const course = getCourseBySlug(root) ?? P3_COURSE;
    const [courseRoot, idOrSlug, pageSegment] = segments;
    if (course.id !== P3_COURSE_ID || !courseRoot) return { kind: 'course-dashboard', course };

    if (courseRoot === 'topics') {
      if (!idOrSlug) return { kind: 'index' };
      const topic = studyTopicForSlug(idOrSlug);
      return topic ? { kind: 'topic', course, topic, page: parseTopicPage(pageSegment) } : { kind: 'index' };
    }

    if (courseRoot === 'regions') {
      if (!idOrSlug) return { kind: 'index' };
      const topic = studyTopicForRegionId(idOrSlug);
      return topic ? { kind: 'topic', course, topic, page: parseTopicPage(pageSegment) } : { kind: 'index' };
    }

    if (courseRoot === 'exam-training') return { kind: 'exam-training', course };

    return { kind: 'course-dashboard', course };
  }

  const [idOrSlug, pageSegment] = segments;

  if (root === 'regions') {
    if (idOrSlug) {
      const topic = studyTopicForRegionId(idOrSlug);
      return topic ? { kind: 'topic', course: P3_COURSE, topic, page: parseTopicPage(pageSegment) } : { kind: 'index' };
    }
    return { kind: 'index' };
  }

  if (root === 'topics') {
    const topic = studyTopicForSlug(idOrSlug);
    return topic ? { kind: 'topic', course: P3_COURSE, topic, page: parseTopicPage(pageSegment) } : { kind: 'index' };
  }

  if (root === 'exam-training') return { kind: 'exam-training', course: P3_COURSE };

  if (STUDY_ROUTE_ROOTS.has(root)) return { kind: 'index' };

  return { kind: 'course-selection' };
}

function localStudyProfile(): Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    realName: 'Local student',
    classGroup: 'Local study',
    teacherName: 'Self study',
    avatarName: 'Student',
    onboardingCompleted: true,
    onboardingCompletedAt: new Date().toISOString(),
  };
}

function studentPracticeModeLabel(course?: CourseMetadata): string {
  return course?.examComponentLabel ?? 'CAIE 9709 Study Hub';
}

function StudentViewFallback({ label }: { label: string }) {
  return (
    <section className="region-panel" aria-busy="true">
      <span className="mode-pill">{label}</span>
      <p>Loading...</p>
    </section>
  );
}

export default function App() {
  const progressAdapter = useMemo(() => getProgressStorageAdapter(), []);
  const [locationKey, setLocationKey] = useState(() => `${window.location.pathname}${window.location.hash}`);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [teachingSnippets, setTeachingSnippets] = useState<TeachingSnippet[]>([]);
  const [generatedPractice, setGeneratedPractice] = useState<GeneratedPracticeItem[]>([]);
  const [progress, setProgress] = useState<StoredProgress>(() => progressAdapter.loadProgressContext());
  const [viewMode, setViewMode] = useState<ViewMode>('course_selection');
  const [selectedCourse, setSelectedCourse] = useState<CourseMetadata>();
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic>();
  const [selectedTopicPage, setSelectedTopicPage] = useState<TopicStudyPage>('hub');
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion>();
  const [trainingIntent, setTrainingIntent] = useState<TrainingSessionIntent>();
  const [examTrainingPracticeMode, setExamTrainingPracticeMode] = useState<ExamTrainingPracticeMode>();

  useEffect(() => {
    function syncPath() {
      setLocationKey(`${window.location.pathname}${window.location.hash}`);
    }
    window.addEventListener('popstate', syncPath);
    window.addEventListener('hashchange', syncPath);
    return () => {
      window.removeEventListener('popstate', syncPath);
      window.removeEventListener('hashchange', syncPath);
    };
  }, []);

  useEffect(() => {
    if (progress.profile) return;
    setProgress(progressAdapter.saveProfile(localStudyProfile()));
  }, [progress.profile, progressAdapter]);

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
    const route = parseStudyRoute(window.location.pathname, window.location.hash);
    if (route.kind === 'course-selection') {
      setSelectedCourse(undefined);
      setSelectedTopic(undefined);
      setSelectedTopicPage('hub');
      setCurrentQuestion(undefined);
      setTrainingIntent(undefined);
      setExamTrainingPracticeMode(undefined);
      setViewMode('course_selection');
      return;
    }

    if (route.kind === 'course-dashboard') {
      setSelectedCourse(route.course);
      setSelectedTopic(undefined);
      setSelectedTopicPage('hub');
      setCurrentQuestion(undefined);
      setTrainingIntent(undefined);
      setExamTrainingPracticeMode(undefined);
      setViewMode('course_dashboard');
      return;
    }

    if (route.kind === 'index') {
      setSelectedCourse(P3_COURSE);
      setSelectedTopic(undefined);
      setSelectedTopicPage('hub');
      setCurrentQuestion(undefined);
      setTrainingIntent(undefined);
      setExamTrainingPracticeMode(undefined);
      setViewMode('index');
      return;
    }

    if (route.kind === 'topic') {
      setSelectedCourse(route.course);
      setSelectedTopic(route.topic);
      setSelectedTopicPage(route.page);
      setCurrentQuestion(undefined);
      setTrainingIntent(undefined);
      setExamTrainingPracticeMode(undefined);
      setViewMode('topic');
      return;
    }

    setSelectedCourse(route.course);
    setSelectedTopic(route.topic);
    setSelectedTopicPage('hub');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
    setExamTrainingPracticeMode(undefined);
    setViewMode('exam_training_dashboard');
  }, [locationKey]);

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

  const selectedRegion = selectedTopic ? regionForStudyTopic(selectedTopic) : undefined;
  const selectedDisplayRegion = selectedTopic && selectedRegion ? displayRegionForTopic(selectedTopic, selectedRegion) : undefined;
  const selectedRegionProgress = selectedRegion ? worldProgress.find((item) => item.region.id === selectedRegion.id) : undefined;
  const selectedRegionLearningSummary = selectedRegion ? regionLearningSummaries[selectedRegion.id] : undefined;
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
  const worldNotice = useMemo(() => {
    const p3 = questions.filter(isTrainableP3Question);
    const imageMetadata = p3.filter((question) => question.questionImageRawPaths.length > 0).length;
    if (questions.length === 0) return 'Practice questions are still loading.';
    if (p3.length === 0) return 'Paper 3 practice is not available right now.';
    if (imageMetadata === 0) return 'Question images are not available right now.';
    return undefined;
  }, [questions]);

  function navigateStudyPath(path: string) {
    const base = currentStaticBasePath(window.location.pathname);
    const nextPath = path === '/' ? `${base || ''}/` : `${base}${path}`;
    window.history.pushState(null, '', nextPath);
    setLocationKey(`${window.location.pathname}${window.location.hash}`);
  }

  function navigateCourseSelection() {
    navigateStudyPath('/');
  }

  function openCourse(course: CourseMetadata) {
    setSelectedCourse(course);
    setSelectedTopic(undefined);
    setSelectedTopicPage('hub');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
    setExamTrainingPracticeMode(undefined);
    setViewMode('course_dashboard');
    navigateStudyPath(`/${course.slug}`);
  }

  function openP3Topics() {
    setSelectedCourse(P3_COURSE);
    setSelectedTopic(undefined);
    setSelectedTopicPage('hub');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
    setExamTrainingPracticeMode(undefined);
    setViewMode('index');
    navigateStudyPath(`/${P3_COURSE_ID}/topics`);
  }

  function openTopic(topic: StudyTopic, page: TopicStudyPage = 'hub') {
    setSelectedTopic(topic);
    setSelectedTopicPage(page);
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
    setExamTrainingPracticeMode(undefined);
    setViewMode('topic');
    navigateStudyPath(p3TopicPath(topic, page));
  }

  function openExamTrainingDashboard(topic?: StudyTopic) {
    setSelectedTopic(topic);
    setSelectedTopicPage('hub');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
    setExamTrainingPracticeMode(undefined);
    setViewMode('exam_training_dashboard');
    navigateStudyPath(`/${P3_COURSE_ID}/exam-training`);
  }

  function activePracticeMode(): PracticeMode {
    return viewMode === 'weak_areas' || viewMode === 'target_topic' || viewMode === 'start' ? viewMode : 'start';
  }

  function practiceModeForTrainingIntent(intent: TrainingSessionIntent | undefined): PracticeMode {
    return intent === 'weak_area_review' ? 'weak_areas' : 'target_topic';
  }

  function practiceModeForDashboardMode(mode: ExamTrainingPracticeMode, hasSelectedRegion: boolean): PracticeMode {
    if (mode === 'weak') return 'weak_areas';
    return hasSelectedRegion ? 'target_topic' : 'start';
  }

  function trainingIntentForDashboardMode(mode: ExamTrainingPracticeMode): TrainingSessionIntent | undefined {
    if (mode === 'core') return 'core_practice';
    if (mode === 'weak') return 'weak_area_review';
    return undefined;
  }

  function dashboardPracticeReason(mode: ExamTrainingPracticeMode, region?: RegionDefinition): string {
    const scope = region ? ` in ${region.name}` : '';
    if (mode === 'core') return `Balanced exam-style practice${scope}.`;
    if (mode === 'weak') return `Review practice${scope}. Saved marks and mistake tags are used where available.`;
    return `Stretch Practice${scope}. Selection remains exam-style while topic evidence builds.`;
  }

  function p3Questions() {
    return trainableQuestions.filter(isTrainableP3Question);
  }

  function globalExamTrainingQuestions(): NormalizedQuestion[] {
    return p3Questions();
  }

  function chooseNext(nextProgress = progress, mode: PracticeMode = activePracticeMode()) {
    const candidateQuestions = selectedRegion ? filterTrainableQuestionsForRegion(trainableQuestions, selectedRegion) : globalExamTrainingQuestions();
    setCurrentQuestion(selectNextQuestion(candidateQuestions, {
      mode,
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
      currentQuestionId: currentQuestion?.id,
    }));
  }

  function startDashboardPractice(mode: ExamTrainingPracticeMode) {
    const region = selectedRegion;
    setExamTrainingPracticeMode(mode);
    const selectionMode = practiceModeForDashboardMode(mode, Boolean(region));
    const candidateQuestions = region ? filterTrainableQuestionsForRegion(trainableQuestions, region) : globalExamTrainingQuestions();
    if (!candidateQuestions.length) {
      openExamTrainingDashboard(region ? selectedTopic : undefined);
      return;
    }
    setTrainingIntent(trainingIntentForDashboardMode(mode));
    setViewMode(selectionMode === 'weak_areas' ? 'weak_areas' : region ? 'target_topic' : 'start');
    setCurrentQuestion(selectNextQuestion(candidateQuestions, {
      mode: selectionMode,
      attempts: progress.attempts,
      topicProfiles: progress.topicProfiles,
      currentQuestionId: currentQuestion?.id,
    }));
  }

  function reviewWeakAreas(nextProgress = progress) {
    const candidateQuestions = globalExamTrainingQuestions();
    if (!candidateQuestions.length) {
      openExamTrainingDashboard();
      return;
    }
    setSelectedTopic(undefined);
    setSelectedTopicPage('hub');
    setTrainingIntent(undefined);
    setExamTrainingPracticeMode('weak');
    setViewMode('weak_areas');
    setCurrentQuestion(selectNextQuestion(candidateQuestions, {
      mode: 'weak_areas',
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
    }));
  }

  function persistProgressAfterMeaningfulEvent(nextProgress: StoredProgress) {
    setProgress(nextProgress);
  }

  const examTrainingPracticeDisabledReason = globalExamTrainingQuestions().length === 0
    ? worldNotice ?? 'Exam Training questions are not available right now.'
    : undefined;

  return (
    <main className={`app-shell study-app-shell app-view-${viewMode}`}>
      <header className="topbar study-topbar">
        <div className="study-brand">
          <span className="study-brand-mark" aria-hidden="true"><BookOpenCheck size={22} /></span>
          <div>
            <span className="mode-pill">{studentPracticeModeLabel(selectedCourse)}</span>
            <h1>Asterion Study</h1>
          </div>
        </div>
        <nav aria-label="Primary">
          <button className={viewMode === 'course_selection' ? 'active' : ''} type="button" onClick={navigateCourseSelection}>Courses</button>
          {selectedCourse ? (
            <button className={viewMode === 'course_dashboard' ? 'active' : ''} type="button" onClick={() => openCourse(selectedCourse)}>
              {selectedCourse.shortName}
            </button>
          ) : null}
          {selectedCourse?.id === P3_COURSE_ID ? (
            <>
              <button className={viewMode === 'index' || viewMode === 'topic' ? 'active' : ''} type="button" onClick={openP3Topics}>P3 Topics</button>
              <button className={viewMode === 'exam_training_dashboard' || viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'weak_areas' ? 'active' : ''} type="button" onClick={() => openExamTrainingDashboard()}>Exam Training</button>
            </>
          ) : null}
        </nav>
      </header>

      {loadError ? <div className="notice">Question bank not loaded: {loadError}</div> : null}

      {viewMode === 'course_selection' ? (
        <CourseSelector onOpenCourse={openCourse} />
      ) : null}

      {viewMode === 'course_dashboard' && selectedCourse ? (
        <CourseDashboard
          course={selectedCourse}
          onOpenP3Topics={openP3Topics}
          onOpenP3ExamTraining={() => openExamTrainingDashboard()}
        />
      ) : null}

      {viewMode === 'index' ? (
        <TopicIndex
          progress={progress}
          regionProgress={worldProgress}
          questionLoadingNotice={worldNotice}
          onOpenTopic={openTopic}
          onOpenExamTraining={() => openExamTrainingDashboard()}
        />
      ) : null}

      {viewMode === 'topic' && selectedTopic && selectedRegion && selectedRegionProgress && selectedRegionLearningSummary ? (
        <TopicHub
          topic={selectedTopic}
          region={selectedRegion}
          regionProgress={selectedRegionProgress}
          fieldGuide={getRegionFieldGuide(selectedRegion)}
          fieldGuideCompleted={selectedRegionFieldGuideCompleted}
          fieldGuideCompletedTopicIds={Object.keys(progress.regionLearning?.[selectedRegion.id]?.fieldGuideTopicCompletions ?? {})}
          teachingSnippets={selectedRegionTeachingSnippets}
          generatedPractice={selectedRegionGeneratedPractice}
          learningActivityAttempts={progress.learningActivityAttempts.filter((attempt) => attempt.regionId === selectedRegion.id)}
          progress={progress}
          profileId={progress.profile?.id}
          summary={selectedRegionLearningSummary}
          activePage={selectedTopicPage}
          onBackToIndex={openP3Topics}
          onNavigatePage={(page) => openTopic(selectedTopic, page)}
          onCompleteFieldGuide={() => {
            persistProgressAfterMeaningfulEvent(progressAdapter.completeRegionFieldGuide(selectedRegion.id));
          }}
          onCompleteFieldGuideTopic={(topicId) => {
            persistProgressAfterMeaningfulEvent(progressAdapter.completeRegionFieldGuideTopic(selectedRegion.id, topicId));
          }}
          onLearningActivityAttempt={(attempt: LearningActivityAttempt) => {
            persistProgressAfterMeaningfulEvent(progressAdapter.addLearningActivityAttempt(attempt));
          }}
        />
      ) : null}

      {viewMode === 'exam_training_dashboard' ? (
        <Suspense fallback={<StudentViewFallback label="Exam Training loading" />}>
          <ExamTrainingDashboard
            progress={progress}
            questions={questions}
            worldProgress={worldProgress}
            selectedRegion={selectedDisplayRegion}
            practiceDisabledReason={examTrainingPracticeDisabledReason}
            onReturnToMap={openP3Topics}
            onStartPractice={startDashboardPractice}
          />
        </Suspense>
      ) : null}

      {viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'weak_areas' ? (
        <Suspense fallback={<StudentViewFallback label="Practice loading" />}>
          <PracticeView
            question={currentQuestion}
            progress={progress}
            avatarName={progress.profile?.avatarName ?? 'Student'}
            avatar={progress.avatar}
            regionProgress={worldProgress}
            avatarLocation={{ source: 'none', label: 'Study portal' }}
            worldName="CAIE 9709 Paper 3"
            selectedRegion={selectedDisplayRegion}
            selectedRegionRank={selectedRegionProgress?.rank}
            regionLearningPhase={selectedRegion ? 'training' : undefined}
            sessionIntent={selectedRegion && viewMode === 'target_topic' ? trainingIntent ?? selectedRegionLearningSummary?.trainingSession.intent : undefined}
            sessionLabelOverride={examTrainingPracticeMode ? EXAM_TRAINING_PRACTICE_LABELS[examTrainingPracticeMode] : undefined}
            currentPracticeMode={examTrainingPracticeMode}
            sessionReason={examTrainingPracticeMode
              ? dashboardPracticeReason(examTrainingPracticeMode, selectedDisplayRegion)
              : selectedRegion ? selectedRegionLearningSummary?.trainingSession.reason : undefined}
            onAttempt={(attempt: Attempt) => {
              if (!progress.profile || !currentQuestion) return;
              const evidenceAttempt: Attempt = {
                ...attempt,
                masteryEligible: currentQuestion.eligibility?.masteryEligible.eligible,
                guardianEligible: currentQuestion.eligibility?.guardianEligible.eligible,
                masteryEvidenceReadiness: currentQuestion.masteryReadiness?.status,
                masteryEvidenceReasonCodes: currentQuestion.masteryReadiness?.reasonCodes,
                validatedRegionId: currentQuestion.routeEvidence?.validatedRegionId,
                displayRegionId: currentQuestion.routeEvidence?.displayRegionId,
              };
              persistProgressAfterMeaningfulEvent(progressAdapter.addAttempt(evidenceAttempt));
            }}
            onIssue={(questionId: string, issueType: IssueType, note?: string) => {
              persistProgressAfterMeaningfulEvent(progressAdapter.addIssueReport({
                id: createId('issue'),
                profileId: progress.profile?.id,
                questionId,
                issueType,
                note,
                createdAt: new Date().toISOString(),
                worldName: 'CAIE 9709 Paper 3',
                regionName: selectedDisplayRegion?.name,
              }));
            }}
            onReturnToMap={openP3Topics}
            onReviewWeak={() => reviewWeakAreas()}
            onContinuePractice={() => {
              chooseNext(progress, examTrainingPracticeMode
                ? practiceModeForDashboardMode(examTrainingPracticeMode, Boolean(selectedRegion))
                : selectedRegion ? practiceModeForTrainingIntent(trainingIntent) : activePracticeMode());
            }}
            onOpenDashboard={() => openExamTrainingDashboard(selectedTopic)}
            onSelectPracticeMode={(mode) => startDashboardPractice(mode)}
          />
        </Suspense>
      ) : null}
    </main>
  );
}
