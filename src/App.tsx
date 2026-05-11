import { useEffect, useMemo, useState } from 'react';
import { UsersRound } from 'lucide-react';
import { ClassHall } from './components/classHall/ClassHall';
import { ProfileForm } from './components/onboarding/ProfileForm';
import { AvatarBuilder } from './components/profile/AvatarBuilder';
import { PracticeView } from './components/practice/PracticeView';
import { TwinklingStarfield } from './components/shared/TwinklingStarfield';
import { TeacherExport } from './components/teacher/TeacherExport';
import { AstralRegionLedger, P3AstralAcademy } from './components/world/P3AstralAcademy';
import { RegionHub } from './components/world/RegionHub';
import { getRegionFieldGuide } from './data/regionFieldGuides';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { deriveAvatarGear } from './lib/avatarGear';
import { determineAvatarLocation } from './lib/avatarLocation';
import { resolveRuntimeConfig } from './lib/appConfig';
import { getGeneratedPracticeForRegion, loadGeneratedPractice, type GeneratedPracticeItem } from './lib/generatedPractice';
import { loadQuestionBankWithDiagnostics } from './lib/loadQuestionBank';
import { createId, getProgressStorageAdapter } from './lib/progressStore';
import { filterTrainableQuestionsForRegion, isQuestionTrainable, isTrainableP3Question } from './lib/questionTraining';
import { buildRegionLearningSummary, GUARDIAN_PASS_SCORE_RATIO } from './lib/regionLearning';
import { calculateWorldProgress, filterAttemptsForRegion } from './lib/regionProgress';
import { getTeachingSnippetsForRegion, loadTeachingSnippets, type TeachingSnippet } from './lib/teachingSnippets';
import { isP3Question, P3_ASTRAL_ACADEMY, P3_WORLD_NAME } from './lib/worldMap';
import type { Attempt, IssueType, LearningActivityAttempt, NormalizedQuestion, QuestionBankDiagnostics, RegionDefinition, StoredProgress, TrainingSessionIntent } from './types';

type ViewMode = PracticeMode | 'map' | 'regions' | 'region_hub' | 'guardian' | 'profile' | 'class_hall' | 'teacher';

export default function App() {
  const runtimeConfig = useMemo(() => resolveRuntimeConfig(), []);
  const progressAdapter = useMemo(() => getProgressStorageAdapter(), []);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [diagnostics, setDiagnostics] = useState<QuestionBankDiagnostics>();
  const [loadError, setLoadError] = useState<string>();
  const [teachingSnippets, setTeachingSnippets] = useState<TeachingSnippet[]>([]);
  const [generatedPractice, setGeneratedPractice] = useState<GeneratedPracticeItem[]>([]);
  const [progress, setProgress] = useState<StoredProgress>(() => progressAdapter.loadProgressContext());
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionDefinition>();
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion>();
  const [trainingIntent, setTrainingIntent] = useState<TrainingSessionIntent>();

  useEffect(() => {
    loadQuestionBankWithDiagnostics()
      .then((loaded) => {
        setQuestions(loaded.questions);
        setDiagnostics(loaded.diagnostics);
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

  const trainableQuestions = useMemo(() => questions.filter(isQuestionTrainable), [questions]);
  const worldProgress = useMemo(() => calculateWorldProgress(trainableQuestions, progress.attempts, P3_ASTRAL_ACADEMY, progress.regionLearning), [progress.attempts, progress.regionLearning, trainableQuestions]);
  const regionLearningSummaries = useMemo(() => {
    return Object.fromEntries(worldProgress.map((regionProgress) => {
      const regionQuestions = filterTrainableQuestionsForRegion(trainableQuestions, regionProgress.region);
      const regionAttempts = filterAttemptsForRegion(regionProgress.region, progress.attempts, regionQuestions);
      const learningActivityAttempts = progress.learningActivityAttempts.filter((attempt) => attempt.regionId === regionProgress.region.id);
      return [regionProgress.region.id, buildRegionLearningSummary({
        regionProgress,
        learningRecord: progress.regionLearning?.[regionProgress.region.id],
        regionQuestions,
        regionAttempts,
        learningActivityAttempts,
      })];
    }));
  }, [progress.attempts, progress.learningActivityAttempts, progress.regionLearning, trainableQuestions, worldProgress]);
  const avatarGear = useMemo(() => deriveAvatarGear(worldProgress), [worldProgress]);
  const selectedRegionProgress = selectedRegion ? worldProgress.find((item) => item.region.id === selectedRegion.id) : undefined;
  const selectedRegionLearningSummary = selectedRegion ? regionLearningSummaries[selectedRegion.id] : undefined;
  const selectedRegionTeachingSnippets = useMemo(() => (
    selectedRegion
      ? getTeachingSnippetsForRegion(teachingSnippets, P3_ASTRAL_ACADEMY.paperFamily, selectedRegion, 4)
      : []
  ), [selectedRegion, teachingSnippets]);
  const selectedRegionGeneratedPractice = useMemo(() => (
    selectedRegion
      ? getGeneratedPracticeForRegion(generatedPractice, selectedRegion.id, P3_ASTRAL_ACADEMY.paperFamily, 3)
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
    if (questions.length === 0) return 'No questions loaded yet. Check public/data/question_bank.p3.json and the full-bank fallback.';
    if (p3.length === 0) return 'Question bank loaded, but no P3 records were found. Check paper_family labels.';
    if (regionMatches === 0) return 'P3 records loaded, but none matched the current regions. Check topic/DeepSeek labels in Data Health.';
    if (imageMetadata === 0) return 'Questions matched, but images are not loading. Check asset folder layout. Asterion supports /assets/<paper>/..., /assets/questions/p3/<paper>/..., and /assets/questions/<paper>/...';
    return undefined;
  }, [questions, worldProgress]);

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

  function startPractice() {
    setSelectedRegion(undefined);
    setTrainingIntent(undefined);
    setViewMode('start');
    setCurrentQuestion(selectNextQuestion(p3Questions(), {
      mode: 'start',
      attempts: progress.attempts,
      topicProfiles: progress.topicProfiles,
    }));
  }

  function enterRegion(region: RegionDefinition) {
    setSelectedRegion(region);
    setTrainingIntent(undefined);
    setViewMode('region_hub');
    setCurrentQuestion(undefined);
  }

  function startRegionTraining(region: RegionDefinition, intent: TrainingSessionIntent) {
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
    setSelectedRegion(region);
    setTrainingIntent(undefined);
    setViewMode('guardian');
    setCurrentQuestion(question);
  }

  function returnToMap() {
    setViewMode('map');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function openRegions() {
    setViewMode('regions');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function openProfile() {
    setViewMode('profile');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function openClassHall() {
    setSelectedRegion(undefined);
    setViewMode('class_hall');
    setCurrentQuestion(undefined);
    setTrainingIntent(undefined);
  }

  function reviewWeakAreas(nextProgress = progress) {
    setSelectedRegion(undefined);
    setTrainingIntent(undefined);
    setViewMode('weak_areas');
    setCurrentQuestion(selectNextQuestion(p3Questions(), {
      mode: 'weak_areas',
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
    }));
  }

  if (!progress.profile) {
    return (
      <main className="app-shell onboarding-shell">
        <TwinklingStarfield />
        <section className="intro-panel academy-admission">
          <div className="intro-copy">
            <span className="mode-pill">CAIE 9709 · Paper 3 Astral Academy</span>
            <h1>Asterion</h1>
            <p>Step into a local-first maths academy where official question images become encounters, mark schemes become archives, and every restored region is backed by real evidence.</p>
          </div>
          <div className="onboarding-crest-art" aria-hidden="true">
            <svg viewBox="0 0 260 220">
              <path className="crest-ring" d="M44 132a86 86 0 1 1 172 0 86 86 0 0 1-172 0Z" />
              <path className="crest-orbit" d="M28 132c42-46 82-70 120-72 34-2 62 12 84 42" />
              <path className="crest-orbit" d="M36 162c42 18 87 20 134 6 30-9 51-24 64-44" />
              <path className="crest-tower" d="M106 174V98l24-42 24 42v76Z" />
              <path className="crest-window" d="M124 112h12v30h-12Z" />
              <circle cx="68" cy="72" r="4" />
              <circle cx="190" cy="68" r="4" />
              <circle cx="212" cy="144" r="4" />
              <circle cx="54" cy="154" r="4" />
            </svg>
          </div>
          <div className="onboarding-briefing">
            <strong>Academy charter</strong>
            <span>Restore P3 regions with official CAIE question images, mark-scheme checking, and honest self-marked attempts.</span>
            <span>No AI marking. No generated exam clones. No hidden rewards. Your local evidence trail is the source of progress.</span>
          </div>
        </section>
        {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}
        <ProfileForm onSave={(profile) => setProgress(progressAdapter.saveProfile(profile))} />
      </main>
    );
  }

  return (
    <main className={`app-shell app-view-${viewMode}`}>
      <TwinklingStarfield />
      <header className="topbar">
        <div>
          <span className="mode-pill">Local-first classroom mode</span>
          <h1>Asterion</h1>
        </div>
        <nav>
          <button className={viewMode === 'map' ? 'active' : ''} type="button" onClick={returnToMap}>World Map</button>
          <button className={viewMode === 'regions' || viewMode === 'region_hub' ? 'active' : ''} type="button" onClick={openRegions}>Regions</button>
          <button className={viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'guardian' ? 'active' : ''} type="button" onClick={startPractice}>Start Practice</button>
          <button className={viewMode === 'weak_areas' ? 'active' : ''} type="button" onClick={() => reviewWeakAreas()}>Review Weak Areas</button>
          <button className={viewMode === 'class_hall' ? 'active' : ''} type="button" onClick={openClassHall}><UsersRound size={16} /> Class Hall</button>
          <button className={viewMode === 'profile' ? 'active' : ''} type="button" onClick={openProfile}>Profile</button>
          <button className={viewMode === 'teacher' ? 'active' : ''} type="button" onClick={() => setViewMode('teacher')}>Teacher/Export</button>
        </nav>
      </header>

      {loadError ? <div className="notice">Question bank not loaded: {loadError}</div> : null}
      {runtimeConfig.storageNotice ? <div className="notice">{runtimeConfig.storageNotice}</div> : null}

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
          onRegions={openRegions}
          onProfile={openProfile}
          onClassHall={openClassHall}
          onTeacher={() => setViewMode('teacher')}
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
          onCompleteFieldGuide={() => setProgress(progressAdapter.completeRegionFieldGuide(selectedRegion.id))}
          onLearningActivityAttempt={(attempt: LearningActivityAttempt) => setProgress(progressAdapter.addLearningActivityAttempt(attempt))}
          onStartTraining={(intent) => startRegionTraining(selectedRegion, intent)}
          onChallengeGuardian={(question) => challengeGuardian(selectedRegion, question)}
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

      {viewMode === 'teacher' ? (
        <TeacherExport progress={progress} avatarGear={avatarGear} questions={questions} regionProgress={worldProgress} diagnostics={diagnostics} onClear={() => {
          if (window.confirm('Clear this browser profile, attempts, avatar, topic progress, and issue reports?')) {
            setProgress(progressAdapter.clearLocalDemoProgress());
          }
        }} />
      ) : viewMode === 'start' || viewMode === 'target_topic' || viewMode === 'weak_areas' || viewMode === 'guardian' ? (
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
          onAttempt={(attempt: Attempt) => {
            const nextProgress = progressAdapter.addAttempt(attempt);
            if (viewMode === 'guardian' && selectedRegion) {
              const scoreRatio = typeof attempt.scoreRatio === 'number'
                ? attempt.scoreRatio
                : typeof attempt.marksAvailable === 'number' && attempt.marksAvailable > 0
                  ? attempt.marksEarned / attempt.marksAvailable
                  : 0;
              setProgress(progressAdapter.recordRegionGuardianAttempt({
                regionId: selectedRegion.id,
                questionId: attempt.questionId,
                attemptId: attempt.id,
                passed: scoreRatio >= GUARDIAN_PASS_SCORE_RATIO,
                attemptedAt: attempt.attemptedAt,
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
