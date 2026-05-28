import type { Attempt, AvatarSettings, AvatarGear, NormalizedQuestion, RegionLearningRecord, RegionProgress, StudentProfile, StoredProgress } from '../../types';
import { AVATAR_SLOT_LABELS, AVATAR_SLOTS } from '../../data/avatarCatalog';
import { calculateAcademySummary } from '../../lib/academyProgress';
import { getAvatarLayers } from '../../lib/avatarLayers';
import { normalizeAvatarSettings } from '../../lib/avatarStore';
import { buildExamTrainingTopicMastery, type ExamTrainingMasteryStatus, type ExamTrainingTopicMasteryItem } from '../../lib/examTrainingDashboard';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import { MathText } from '../shared/MathText';
import { AvatarPreview } from './AvatarPreview';

interface AvatarBuilderProps {
  profile: StudentProfile;
  avatar: AvatarSettings;
  avatarGear: AvatarGear;
  attempts: Attempt[];
  questions: NormalizedQuestion[];
  topicProfiles?: StoredProgress['topicProfiles'];
  regionLearning?: Record<string, RegionLearningRecord>;
  regionLearningSummaries?: Record<string, RegionLearningSummary>;
  regionProgress: RegionProgress[];
  onAvatarChange: (avatar: AvatarSettings) => void;
}

const leftStageSlots = AVATAR_SLOTS.slice(0, 5);
const rightStageSlots = AVATAR_SLOTS.slice(5);
const crestLabels: Record<AvatarSettings['crest'], string> = {
  star: 'Star crest',
  bolt: 'Bolt crest',
  compass: 'Compass crest',
  orb: 'Orb crest',
};

type ProfileRegionPhase = 'locked' | 'field-guide' | 'skill-check' | 'guardian' | 'complete' | 'needs-practice';

interface ProfileRegionStatus {
  phase: ProfileRegionPhase;
  label: string;
  detail: string;
  percent: number;
}

const topicStatusLabels: Record<ExamTrainingMasteryStatus, { label: string; className: string }> = {
  strong: { label: 'Secure', className: 'secure' },
  secure: { label: 'Ready', className: 'ready' },
  developing: { label: 'In progress', className: 'in-progress' },
  needs_work: { label: 'Needs practice', className: 'needs-practice' },
  not_tried: { label: 'Not started', className: 'not-started' },
};

function regionStatusFromProgress(
  progress: RegionProgress,
  summary?: RegionLearningSummary,
  learningRecord?: RegionLearningRecord,
): ProfileRegionStatus {
  if (summary?.state === 'locked' || !progress.isActive) {
    return { phase: 'locked', label: 'Locked', detail: 'Opens later in the academy map.', percent: 0 };
  }

  if (summary?.state === 'mastered' || summary?.state === 'guardian_cleared' || progress.rank === 'Mastered' || learningRecord?.guardianClearedAt) {
    return { phase: 'complete', label: 'Complete', detail: 'Guardian cleared for this region.', percent: 100 };
  }

  if (summary?.state === 'needs_review') {
    return { phase: 'needs-practice', label: 'Needs practice', detail: 'Return to Skill Check before another Guardian run.', percent: 70 };
  }

  if (summary?.state === 'guardian_attempted') {
    return { phase: 'guardian', label: 'Guardian', detail: 'Guardian attempted. Retry is available.', percent: 86 };
  }

  if (summary?.state === 'guardian_unlocked' || learningRecord?.guardianAttemptedAt) {
    return { phase: 'guardian', label: 'Guardian', detail: 'Guardian challenge is open.', percent: 80 };
  }

  const skillCheckAttempts = summary?.learningActivityReadiness.attempts ?? 0;
  if (summary?.state === 'training_in_progress' || skillCheckAttempts > 0) {
    return {
      phase: 'skill-check',
      label: 'Skill Check',
      detail: `${skillCheckAttempts || progress.attempts} support ${skillCheckAttempts === 1 ? 'attempt' : 'attempts'} saved.`,
      percent: 62,
    };
  }

  if (summary?.state === 'field_guide_completed' || learningRecord?.fieldGuideCompletedAt) {
    return { phase: 'skill-check', label: 'Skill Check', detail: 'Field Guide complete. Skill Check is next.', percent: 45 };
  }

  if (summary?.state === 'field_guide_started' || learningRecord?.fieldGuideStartedAt) {
    return { phase: 'field-guide', label: 'Field Guide', detail: 'Field Guide is underway.', percent: 24 };
  }

  if (progress.attempts > 0) {
    return {
      phase: 'skill-check',
      label: 'Skill Check',
      detail: `${progress.attempts} saved practice ${progress.attempts === 1 ? 'attempt' : 'attempts'}.`,
      percent: 56,
    };
  }

  return { phase: 'field-guide', label: 'Field Guide', detail: 'Start with the region Field Guide.', percent: 12 };
}

function topicStatus(item: ExamTrainingTopicMasteryItem) {
  return topicStatusLabels[item.status];
}

export function AvatarBuilder({
  profile,
  avatar,
  avatarGear,
  attempts,
  questions,
  topicProfiles,
  regionLearning,
  regionLearningSummaries,
  regionProgress,
  onAvatarChange,
}: AvatarBuilderProps) {
  const summary = calculateAcademySummary(regionProgress);
  const topicMastery = buildExamTrainingTopicMastery({
    progress: {
      schemaVersion: 1,
      profile,
      avatar,
      attempts,
      learningActivityAttempts: [],
      topicProfiles: topicProfiles ?? {},
      issueReports: [],
      regionLearning,
      settings: { activePaperFamily: 'p3' },
    },
    questions,
  });
  const avatarForProgress = normalizeAvatarSettings(avatar, regionProgress);
  const equippedLayers = getAvatarLayers(avatarForProgress, regionProgress);
  const activeRegionCount = regionProgress.filter((progress) => progress.isActive).length;
  const restoredTotal = Math.max(activeRegionCount, avatarGear.restoredRegions, 1);
  const restoredPercent = Math.round((avatarGear.restoredRegions / restoredTotal) * 100);
  const recentReward = avatarGear.gear.length ? avatarGear.gear[avatarGear.gear.length - 1] : 'Starter crest';
  const earnedRewards = avatarGear.gear.length ? avatarGear.gear : ['Starter crest'];
  const equippedFrame = equippedLayers.find((layer) => layer.slot === 'frame')?.item.displayName ?? 'Starter frame';
  const strongestRegion = avatarGear.strongestRegionName
    ? `${avatarGear.strongestRegionName} (${avatarGear.strongestRegionRank})`
    : 'No restored region yet';

  return (
    <section className="avatar-builder-page" aria-labelledby="avatar-builder-title">
      <header className="avatar-builder-header">
        <span className="mode-pill">Character sheet</span>
        <h2 id="avatar-builder-title">Avatar Builder</h2>
        <p>Your fixed starter avatar is active for this pilot. Progress evidence is still tracked locally for future visible rewards.</p>
      </header>

      <section className="avatar-builder-hero">
        <div className="avatar-showcase">
          <div className="avatar-showcase-stage">
            <div className="avatar-showcase-arch" aria-hidden="true" />
            <div className="equipped-slots-panel equipped-slots-left" aria-label="Equipped core avatar slots">
              {leftStageSlots.map((slot) => {
                const layer = equippedLayers.find((candidate) => candidate.slot === slot);
                return (
                  <span key={slot}>
                    <small>{AVATAR_SLOT_LABELS[slot]}</small>
                    {layer?.item.displayName ?? 'Not set'}
                  </span>
                );
              })}
            </div>
            <AvatarPreview avatarName={profile.avatarName} avatar={avatarForProgress} regionProgress={regionProgress} />
            <div className="equipped-slots-panel equipped-slots-right" aria-label="Equipped reward avatar slots">
              {rightStageSlots.map((slot) => {
                const layer = equippedLayers.find((candidate) => candidate.slot === slot);
                return (
                  <span key={slot}>
                    <small>{AVATAR_SLOT_LABELS[slot]}</small>
                    {layer?.item.displayName ?? 'Not set'}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="avatar-showcase-dashboard">
            <section className="student-details-panel reward-identity-card" aria-labelledby="student-details-title">
              <div className="student-identity-heading">
                <span className={`student-crest student-crest-${avatarForProgress.crest}`} aria-hidden="true" />
                <div>
                  <span>Student Details</span>
                  <h3 id="student-details-title">{profile.avatarName}</h3>
                  <p>{avatarGear.title}</p>
                </div>
              </div>

              <div className="student-reward-focus">
                <span>Equipped crest</span>
                <strong>{crestLabels[avatarForProgress.crest]}</strong>
                <small>{equippedFrame}</small>
              </div>

              <dl className="student-reward-stats" aria-label="Student reward evidence">
                <div><dt>Evidence XP</dt><dd>{summary.totalXp}</dd></div>
                <div><dt>Attempts</dt><dd>{summary.attempts}</dd></div>
                <div><dt>Restored</dt><dd>{avatarGear.restoredRegions}/{restoredTotal}</dd></div>
                <div><dt>Gold</dt><dd>{avatarGear.goldRegions}</dd></div>
              </dl>

              <div className="student-reward-meter" aria-label={`${restoredPercent}% of active regions restored`}>
                <span style={{ width: `${restoredPercent}%` }} />
              </div>

              <div className="student-reward-row">
                <span>Recent reward</span>
                <strong>{recentReward}</strong>
                <small>{strongestRegion}</small>
              </div>

              <div className="earned-reward-list" aria-label="Earned pins, badges, and crests">
                {earnedRewards.slice(0, 6).map((reward) => <span key={reward}>{reward}</span>)}
              </div>
            </section>

            <div className="avatar-showcase-reward-stack">
              <div className="avatar-evidence-strip">
                <span>
                  <span>Evidence XP</span>
                  <strong>{summary.totalXp}</strong>
                </span>
                <span>
                  <span>Restored</span>
                  <strong>{avatarGear.restoredRegions}</strong>
                </span>
                <span>
                  <span>Gold</span>
                  <strong>{avatarGear.goldRegions}</strong>
                </span>
                <span>
                  <span>Attempts</span>
                  <strong>{summary.attempts}</strong>
                </span>
              </div>

              <article className="next-unlock-card avatar-starter-unlock-card">
                <div className="next-unlock-preview" aria-hidden="true">
                  <span>Later</span>
                </div>
                <div className="next-unlock-copy">
                  <span>Future visible styles</span>
                  <h3>More avatar styles unlock later</h3>
                  <p>For this pilot, your saved academic evidence is tracked while visible hair, expression, and outfit choices stay hidden until their previews and layers are ready.</p>
                  <div className="next-unlock-meter" aria-label="Starter avatar active">
                    <span style={{ width: '25%' }} />
                  </div>
                  <strong>Starter avatar active</strong>
                </div>
              </article>
            </div>
          </div>
        </div>

        <aside className="avatar-builder-sidebar profile-progress-sidebar" aria-label="Student progress dashboard">
          <section className="profile-region-progress-card" aria-labelledby="profile-region-progress-title">
            <div className="profile-progress-heading">
              <div>
                <span>Region Completion Status</span>
                <h3 id="profile-region-progress-title">Field Guide → Skill Check → Guardian</h3>
              </div>
              <small>{regionProgress.length} regions</small>
            </div>

            <div className="profile-region-list">
              {regionProgress.map((progress) => {
                const status = regionStatusFromProgress(
                  progress,
                  regionLearningSummaries?.[progress.region.id],
                  regionLearning?.[progress.region.id],
                );
                return (
                  <article key={progress.region.id} className={`profile-region-row profile-region-${status.phase}`}>
                    <div className="profile-region-row-main">
                      <strong>{progress.region.name}</strong>
                      <span>{status.label}</span>
                    </div>
                    <div className="profile-region-meter" aria-label={`${progress.region.name} ${status.percent}% complete`}>
                      <span style={{ width: `${status.percent}%` }} />
                    </div>
                    <small>{status.detail}</small>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="profile-topic-status-card" aria-labelledby="profile-topic-status-title">
            <div className="profile-progress-heading">
              <div>
                <span>Topic Mastery Status</span>
                <h3 id="profile-topic-status-title">Practice progress by subtopic</h3>
              </div>
              <small>{topicMastery.length} skills</small>
            </div>
            <p className="profile-topic-status-note">Based on saved mastery-eligible practice. Skill Check is support practice and does not by itself prove exam mastery.</p>
            <div className="profile-topic-status-grid">
              {topicMastery.map((item) => {
                const status = topicStatus(item);
                return (
                  <article key={item.skillId} className={`profile-topic-status-item topic-status-${status.className}`}>
                    <div>
                      <strong><MathText text={item.name} /></strong>
                      <span>{item.evidenceLabel}</span>
                    </div>
                    <small>{status.label}</small>
                    <div className="profile-topic-meter" aria-label={`${item.name} ${status.label}`}>
                      <span style={{ width: `${item.scorePercent ?? 0}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>
      </section>

      <section className="gear-inventory avatar-starter-honesty-panel" aria-labelledby="gear-inventory-title">
        <div className="gear-inventory-heading">
          <div>
            <span className="mode-pill">Starter avatar active</span>
            <h3 id="gear-inventory-title">Avatar Gear</h3>
          </div>
          <p>More avatar styles unlock later. Hair, expression, outfit, accessory, aura, companion, and frame choices stay hidden until their live layers and previews visibly change the avatar.</p>
        </div>
        <div className="avatar-honesty-grid" aria-label="Avatar customization status">
          <span><strong>Visible now</strong><small>v0.3 starter avatar</small></span>
          <span><strong>Coming soon</strong><small>Hair and expression choices</small></span>
          <span><strong>Coming soon</strong><small>Outfit and reward cosmetics</small></span>
        </div>
      </section>
    </section>
  );
}
