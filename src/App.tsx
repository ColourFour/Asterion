import { useEffect, useMemo, useState } from 'react';
import { AvatarPanel } from './components/avatar/AvatarPanel';
import { ProfileForm } from './components/onboarding/ProfileForm';
import { PracticeView } from './components/practice/PracticeView';
import { TeacherExport } from './components/teacher/TeacherExport';
import { P3AstralAcademy } from './components/world/P3AstralAcademy';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { deriveAvatarGear } from './lib/avatarGear';
import { loadQuestionBankWithDiagnostics } from './lib/loadQuestionBank';
import { addAttempt, addIssueReport, clearProgress, createId, loadProgress, saveAvatar, saveProfile } from './lib/progressStore';
import { calculateWorldProgress } from './lib/regionProgress';
import { filterQuestionsForRegion, isP3Question, P3_ASTRAL_ACADEMY, P3_WORLD_NAME } from './lib/worldMap';
import type { Attempt, IssueType, NormalizedQuestion, QuestionBankDiagnostics, RegionDefinition, StoredProgress } from './types';

type ViewMode = PracticeMode | 'map' | 'teacher';

export default function App() {
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [diagnostics, setDiagnostics] = useState<QuestionBankDiagnostics>();
  const [loadError, setLoadError] = useState<string>();
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [selectedRegion, setSelectedRegion] = useState<RegionDefinition>();
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion>();

  useEffect(() => {
    loadQuestionBankWithDiagnostics()
      .then((loaded) => {
        setQuestions(loaded.questions);
        setDiagnostics(loaded.diagnostics);
        setCurrentQuestion(undefined);
      })
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  const worldProgress = useMemo(() => calculateWorldProgress(questions, progress.attempts), [questions, progress.attempts]);
  const avatarGear = useMemo(() => deriveAvatarGear(worldProgress), [worldProgress]);
  const selectedRegionProgress = selectedRegion ? worldProgress.find((item) => item.region.id === selectedRegion.id) : undefined;
  const worldNotice = useMemo(() => {
    const p3 = questions.filter(isP3Question);
    const regionMatches = worldProgress.reduce((sum, item) => sum + item.availableQuestions, 0);
    const imageMetadata = p3.filter((question) => question.questionImageRawPaths.length > 0).length;
    if (questions.length === 0) return 'No questions loaded yet. Check public/data/question_bank.json.';
    if (p3.length === 0) return 'Question bank loaded, but no P3 records were found. Check paper_family labels.';
    if (regionMatches === 0) return 'P3 records loaded, but none matched the current regions. Check topic/DeepSeek labels in Data Health.';
    if (imageMetadata === 0) return 'Questions matched, but images are not loading. Check asset folder layout. Asterion supports both /assets/questions/p3/<paper>/... and /assets/questions/<paper>/...';
    return undefined;
  }, [questions, worldProgress]);

  function activePracticeMode(): PracticeMode {
    return viewMode === 'weak_areas' || viewMode === 'target_topic' || viewMode === 'start' ? viewMode : 'start';
  }

  function chooseNext(nextProgress = progress, mode: PracticeMode = activePracticeMode()) {
    const candidateQuestions = selectedRegion ? filterQuestionsForRegion(questions, selectedRegion) : p3Questions();
    setCurrentQuestion(selectNextQuestion(candidateQuestions, {
      mode,
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
      currentQuestionId: currentQuestion?.id,
    }));
  }

  function p3Questions() {
    return questions.filter(isP3Question);
  }

  function startPractice() {
    setSelectedRegion(undefined);
    setViewMode('start');
    setCurrentQuestion(selectNextQuestion(p3Questions(), {
      mode: 'start',
      attempts: progress.attempts,
      topicProfiles: progress.topicProfiles,
    }));
  }

  function enterRegion(region: RegionDefinition) {
    setSelectedRegion(region);
    setViewMode('target_topic');
    setCurrentQuestion(selectNextQuestion(filterQuestionsForRegion(questions, region), {
      mode: 'target_topic',
      attempts: progress.attempts,
      topicProfiles: progress.topicProfiles,
    }));
  }

  function returnToMap() {
    setViewMode('map');
    setCurrentQuestion(undefined);
  }

  function reviewWeakAreas(nextProgress = progress) {
    setSelectedRegion(undefined);
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
        <section className="intro-panel">
          <span className="mode-pill">CAIE 9709 · Paper 3 MVP</span>
          <h1>Asterion</h1>
          <p>Image-first adaptive practice for algebra, trigonometry, complex numbers, and the wider Pure Mathematics 3 map.</p>
        </section>
        <ProfileForm onSave={(profile) => setProgress(saveProfile(profile))} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="mode-pill">Local-first classroom mode</span>
          <h1>{viewMode === 'map' ? P3_WORLD_NAME : 'Asterion'}</h1>
        </div>
        <nav>
          <button className={viewMode === 'map' ? 'active' : ''} type="button" onClick={returnToMap}>World Map</button>
          <button className={viewMode === 'start' ? 'active' : ''} type="button" onClick={startPractice}>Start Practice</button>
          <button className={viewMode === 'weak_areas' ? 'active' : ''} type="button" onClick={() => reviewWeakAreas()}>Review Weak Areas</button>
          <button className={viewMode === 'teacher' ? 'active' : ''} type="button" onClick={() => setViewMode('teacher')}>Teacher/Export</button>
        </nav>
      </header>

      {loadError ? <div className="notice">Question bank not loaded: {loadError}</div> : null}

      <section className="dashboard-band">
        <ProfileForm profile={progress.profile} onSave={(profile) => setProgress(saveProfile(profile, progress.profile))} />
        <AvatarPanel avatarName={progress.profile.avatarName} avatar={progress.avatar} topicProfiles={progress.topicProfiles} gear={avatarGear} editable onChange={(avatar) => setProgress(saveAvatar(avatar))} />
      </section>

      {viewMode === 'map' ? (
        <P3AstralAcademy
          world={P3_ASTRAL_ACADEMY}
          progress={worldProgress}
          notice={worldNotice}
          onTrain={enterRegion}
          onReviewWeak={() => reviewWeakAreas()}
          onTeacher={() => setViewMode('teacher')}
        />
      ) : null}

      {viewMode === 'teacher' ? (
        <TeacherExport progress={progress} avatarGear={avatarGear} questions={questions} regionProgress={worldProgress} diagnostics={diagnostics} onClear={() => {
          if (window.confirm('Clear this browser profile, attempts, avatar, topic progress, and issue reports?')) {
            setProgress(clearProgress());
          }
        }} />
      ) : viewMode !== 'map' ? (
        <PracticeView
          question={currentQuestion}
          progress={progress}
          worldName={selectedRegion ? P3_WORLD_NAME : undefined}
          selectedRegion={selectedRegion}
          selectedRegionRank={selectedRegionProgress?.rank}
          onAttempt={(attempt: Attempt) => {
            const nextProgress = addAttempt(attempt);
            setProgress(nextProgress);
          }}
          onIssue={(questionId: string, issueType: IssueType, note?: string) => {
            setProgress(addIssueReport({ id: createId('issue'), profileId: progress.profile?.id, questionId, issueType, note, createdAt: new Date().toISOString(), worldName: selectedRegion ? P3_WORLD_NAME : undefined, regionName: selectedRegion?.name }));
          }}
          onReturnToMap={returnToMap}
          onReviewWeak={() => reviewWeakAreas()}
          onContinuePractice={() => chooseNext(progress, selectedRegion ? 'target_topic' : activePracticeMode())}
        />
      ) : null}

      <AvatarPanel avatarName={progress.profile.avatarName} avatar={progress.avatar} topicProfiles={progress.topicProfiles} gear={avatarGear} />
    </main>
  );
}
