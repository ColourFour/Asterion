import { useEffect, useMemo, useState } from 'react';
import { AvatarPanel } from './components/avatar/AvatarPanel';
import { ProfileForm } from './components/onboarding/ProfileForm';
import { PracticeView } from './components/practice/PracticeView';
import { TeacherExport } from './components/teacher/TeacherExport';
import { TopicGrid } from './components/shared/TopicGrid';
import { selectNextQuestion, type PracticeMode } from './lib/adaptiveEngine';
import { loadQuestionBank } from './lib/loadQuestionBank';
import { addAttempt, addIssueReport, clearProgress, createId, loadProgress, saveAvatar, saveProfile } from './lib/progressStore';
import type { Attempt, IssueType, NormalizedQuestion, StoredProgress } from './types';

type ViewMode = PracticeMode | 'teacher';

export default function App() {
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [viewMode, setViewMode] = useState<ViewMode>('start');
  const [targetTopic, setTargetTopic] = useState<string>();
  const [currentQuestion, setCurrentQuestion] = useState<NormalizedQuestion>();

  useEffect(() => {
    loadQuestionBank()
      .then((loaded) => {
        setQuestions(loaded);
        setCurrentQuestion(selectNextQuestion(loaded, { mode: 'start', attempts: progress.attempts, topicProfiles: progress.topicProfiles }));
      })
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  const availableTopics = useMemo(() => Array.from(new Set(questions.map((question) => question.displayTopic))).sort(), [questions]);

  function chooseNext(nextProgress = progress, mode: PracticeMode = viewMode === 'teacher' ? 'start' : viewMode) {
    setCurrentQuestion(selectNextQuestion(questions, {
      mode,
      targetTopic,
      attempts: nextProgress.attempts,
      topicProfiles: nextProgress.topicProfiles,
      currentQuestionId: currentQuestion?.id,
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
          <h1>Asterion</h1>
        </div>
        <nav>
          <button className={viewMode === 'start' ? 'active' : ''} type="button" onClick={() => { setViewMode('start'); chooseNext(progress, 'start'); }}>Start Practice</button>
          <button className={viewMode === 'target_topic' ? 'active' : ''} type="button" onClick={() => setViewMode('target_topic')}>Target Topic</button>
          <button className={viewMode === 'weak_areas' ? 'active' : ''} type="button" onClick={() => { setViewMode('weak_areas'); chooseNext(progress, 'weak_areas'); }}>Review Weak Areas</button>
          <button className={viewMode === 'teacher' ? 'active' : ''} type="button" onClick={() => setViewMode('teacher')}>Teacher/Export</button>
        </nav>
      </header>

      {loadError ? <div className="notice">Question bank not loaded: {loadError}</div> : null}

      <section className="dashboard-band">
        <ProfileForm profile={progress.profile} onSave={(profile) => setProgress(saveProfile(profile, progress.profile))} />
        <AvatarPanel avatarName={progress.profile.avatarName} avatar={progress.avatar} topicProfiles={progress.topicProfiles} editable onChange={(avatar) => setProgress(saveAvatar(avatar))} />
      </section>

      {viewMode === 'target_topic' ? (
        <>
          <TopicGrid selectedTopic={targetTopic} profiles={progress.topicProfiles} onSelect={(topic) => { setTargetTopic(topic); setCurrentQuestion(selectNextQuestion(questions, { mode: 'target_topic', targetTopic: topic, attempts: progress.attempts, topicProfiles: progress.topicProfiles })); }} />
          {availableTopics.length ? <p className="bank-note">Loaded bank topics: {availableTopics.join(', ')}</p> : null}
        </>
      ) : null}

      {viewMode === 'teacher' ? (
        <TeacherExport progress={progress} onClear={() => {
          if (window.confirm('Clear this browser profile, attempts, avatar, topic progress, and issue reports?')) {
            setProgress(clearProgress());
          }
        }} />
      ) : (
        <PracticeView
          question={currentQuestion}
          progress={progress}
          onAttempt={(attempt: Attempt) => {
            const nextProgress = addAttempt(attempt);
            setProgress(nextProgress);
            chooseNext(nextProgress, viewMode as PracticeMode);
          }}
          onIssue={(questionId: string, issueType: IssueType, note?: string) => {
            setProgress(addIssueReport({ id: createId('issue'), profileId: progress.profile?.id, questionId, issueType, note, createdAt: new Date().toISOString() }));
          }}
        />
      )}

      <AvatarPanel avatarName={progress.profile.avatarName} avatar={progress.avatar} topicProfiles={progress.topicProfiles} />
    </main>
  );
}
