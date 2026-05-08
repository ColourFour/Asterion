import { useEffect, useMemo, useState } from 'react';
import { ProfileForm } from './components/onboarding/ProfileForm';
import { AvatarBuilder } from './components/profile/AvatarBuilder';
import { PracticeView } from './components/practice/PracticeView';
import { TwinklingStarfield } from './components/shared/TwinklingStarfield';
import { TeacherExport } from './components/teacher/TeacherExport';
import { AstralRegionLedger, P3AstralAcademy } from './components/world/P3AstralAcademy';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { deriveAvatarGear } from './lib/avatarGear';
import { determineAvatarLocation } from './lib/avatarLocation';
import { loadQuestionBankWithDiagnostics } from './lib/loadQuestionBank';
import { addAttempt, addIssueReport, clearProgress, createId, loadProgress, saveAvatar, saveProfile } from './lib/progressStore';
import { calculateWorldProgress } from './lib/regionProgress';
import { filterQuestionsForRegion, isP3Question, P3_ASTRAL_ACADEMY, P3_WORLD_NAME } from './lib/worldMap';
import type { Attempt, IssueType, NormalizedQuestion, QuestionBankDiagnostics, RegionDefinition, StoredProgress } from './types';

type ViewMode = PracticeMode | 'map' | 'regions' | 'profile' | 'teacher';

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
  const avatarLocation = useMemo(
    () => determineAvatarLocation({ progress: worldProgress, selectedRegion, currentQuestion }),
    [worldProgress, selectedRegion, currentQuestion],
  );
  const worldNotice = useMemo(() => {
    const p3 = questions.filter(isP3Question);
    const regionMatches = worldProgress.reduce((sum, item) => sum + item.availableQuestions, 0);
    const imageMetadata = p3.filter((question) => question.questionImageRawPaths.length > 0).length;
    if (questions.length === 0) return 'No questions loaded yet. Check public/data/question_bank.json.';
    if (p3.length === 0) return 'Question bank loaded, but no P3 records were found. Check paper_family labels.';
    if (regionMatches === 0) return 'P3 records loaded, but none matched the current regions. Check topic/DeepSeek labels in Data Health.';
    if (imageMetadata === 0) return 'Questions matched, but images are not loading. Check asset folder layout. Asterion supports /assets/<paper>/..., /assets/questions/p3/<paper>/..., and /assets/questions/<paper>/...';
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

  function openRegions() {
    setViewMode('regions');
    setCurrentQuestion(undefined);
  }

  function openProfile() {
    setViewMode('profile');
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
            <span>No AI marking. No synthetic questions. No hidden rewards. Your local evidence trail is the source of progress.</span>
          </div>
        </section>
        <ProfileForm onSave={(profile) => setProgress(saveProfile(profile))} />
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
          <button className={viewMode === 'regions' ? 'active' : ''} type="button" onClick={openRegions}>Regions</button>
          <button className={viewMode === 'start' || viewMode === 'target_topic' ? 'active' : ''} type="button" onClick={startPractice}>Start Practice</button>
          <button className={viewMode === 'weak_areas' ? 'active' : ''} type="button" onClick={() => reviewWeakAreas()}>Review Weak Areas</button>
          <button className={viewMode === 'profile' ? 'active' : ''} type="button" onClick={openProfile}>Profile</button>
          <button className={viewMode === 'teacher' ? 'active' : ''} type="button" onClick={() => setViewMode('teacher')}>Teacher/Export</button>
        </nav>
      </header>

      {loadError ? <div className="notice">Question bank not loaded: {loadError}</div> : null}

      {viewMode === 'map' ? (
        <P3AstralAcademy
          world={P3_ASTRAL_ACADEMY}
          progress={worldProgress}
          avatarName={progress.profile.avatarName}
          avatar={progress.avatar}
          avatarLocation={avatarLocation}
          notice={worldNotice}
          onTrain={enterRegion}
          onRegions={openRegions}
          onProfile={openProfile}
          onTeacher={() => setViewMode('teacher')}
        />
      ) : null}

      {viewMode === 'regions' ? (
        <AstralRegionLedger progress={worldProgress} onTrain={enterRegion} />
      ) : null}

      {viewMode === 'profile' ? (
        <AvatarBuilder
          profile={progress.profile}
          avatar={progress.avatar}
          avatarGear={avatarGear}
          regionProgress={worldProgress}
          onAvatarChange={(avatar) => setProgress(saveAvatar(avatar))}
          onProfileSave={(profile) => setProgress(saveProfile(profile, progress.profile))}
        />
      ) : null}

      {viewMode === 'teacher' ? (
        <TeacherExport progress={progress} avatarGear={avatarGear} questions={questions} regionProgress={worldProgress} diagnostics={diagnostics} onClear={() => {
          if (window.confirm('Clear this browser profile, attempts, avatar, topic progress, and issue reports?')) {
            setProgress(clearProgress());
          }
        }} />
      ) : viewMode !== 'map' && viewMode !== 'regions' && viewMode !== 'profile' ? (
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

    </main>
  );
}
