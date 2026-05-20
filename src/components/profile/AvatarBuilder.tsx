import type { Attempt, AvatarSettings, AvatarGear, NormalizedQuestion, RegionLearningRecord, RegionProgress, StudentProfile } from '../../types';
import { AVATAR_SLOT_LABELS, AVATAR_SLOTS, type AvatarItem } from '../../data/avatarCatalog';
import { calculateAcademySummary } from '../../lib/academyProgress';
import { getAvatarLayers } from '../../lib/avatarLayers';
import { equipAvatarItem, normalizeAvatarSettings } from '../../lib/avatarStore';
import { selectNextAvatarUnlock } from '../../lib/avatarUnlocks';
import { calculateP3ReadinessIndex, type P3ReadinessIndex } from '../../lib/p3Readiness';
import { AvatarPreview } from './AvatarPreview';
import { GearInventory } from './GearInventory';
import { NextUnlockCard } from './NextUnlockCard';

interface AvatarBuilderProps {
  profile: StudentProfile;
  avatar: AvatarSettings;
  avatarGear: AvatarGear;
  attempts: Attempt[];
  questions: NormalizedQuestion[];
  regionLearning?: Record<string, RegionLearningRecord>;
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

function readinessClass(readiness: P3ReadinessIndex): string {
  return readiness.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AvatarBuilder({ profile, avatar, avatarGear, attempts, questions, regionLearning, regionProgress, onAvatarChange }: AvatarBuilderProps) {
  const summary = calculateAcademySummary(regionProgress);
  const p3Readiness = calculateP3ReadinessIndex({ attempts, questions, regionLearning });
  const avatarForProgress = normalizeAvatarSettings(avatar, regionProgress);
  const equippedLayers = getAvatarLayers(avatarForProgress, regionProgress);
  const nextUnlock = selectNextAvatarUnlock(regionProgress);
  const activeRegionCount = regionProgress.filter((progress) => progress.isActive).length;
  const restoredTotal = Math.max(activeRegionCount, avatarGear.restoredRegions, 1);
  const restoredPercent = Math.round((avatarGear.restoredRegions / restoredTotal) * 100);
  const recentReward = avatarGear.gear.length ? avatarGear.gear[avatarGear.gear.length - 1] : 'Starter crest';
  const earnedRewards = avatarGear.gear.length ? avatarGear.gear : ['Starter crest'];
  const equippedFrame = equippedLayers.find((layer) => layer.slot === 'frame')?.item.displayName ?? 'Starter frame';
  const nextRewardName = nextUnlock?.item.displayName ?? avatarGear.nextUnlock ?? 'Reward path complete';
  const nextRewardRequirement = nextUnlock?.progress.label ?? avatarGear.nextUnlockRequirement ?? 'All current academy rewards earned.';
  const strongestRegion = avatarGear.strongestRegionName
    ? `${avatarGear.strongestRegionName} (${avatarGear.strongestRegionRank})`
    : 'No restored region yet';

  function handleEquip(item: AvatarItem) {
    onAvatarChange(equipAvatarItem(avatarForProgress, item, regionProgress));
  }

  return (
    <section className="avatar-builder-page" aria-labelledby="avatar-builder-title">
      <header className="avatar-builder-header">
        <span className="mode-pill">Character sheet</span>
        <h2 id="avatar-builder-title">Avatar Builder</h2>
        <p>Equip mastery rewards earned from real region progress. This sheet is saved on this browser/device only.</p>
      </header>

      <section className="avatar-builder-hero">
        <div className="avatar-showcase">
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
          <div className="avatar-showcase-meta">
            <div>
              <span>Character</span>
              <h3>{profile.avatarName}</h3>
            </div>
            <strong>{avatarGear.title}</strong>
          </div>
        </div>

        <aside className="avatar-builder-sidebar" aria-label="Avatar progression summary">
          <section className={`p3-readiness-card readiness-${readinessClass(p3Readiness)}`} aria-labelledby="p3-readiness-title">
            <div className="p3-readiness-heading">
              <div>
                <span>Assessment readiness</span>
                <h3 id="p3-readiness-title">P3 Readiness Index</h3>
              </div>
              <strong>{p3Readiness.score}/100</strong>
            </div>
            <div className="p3-readiness-status">
              <span>{p3Readiness.label}</span>
              <p>{p3Readiness.explanation}</p>
            </div>
            <dl className="p3-readiness-metrics" aria-label="P3 readiness evidence">
              {p3Readiness.metrics.map((metric) => (
                <div key={metric.label} className={metric.met ? 'metric-met' : 'metric-gap'}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                  {metric.target ? <small>{metric.target}</small> : null}
                </div>
              ))}
            </dl>
            <div className="p3-readiness-reasons">
              {(p3Readiness.concerns.length ? p3Readiness.concerns : p3Readiness.strengths).slice(0, 3).map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          </section>

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

          <NextUnlockCard nextUnlock={nextUnlock} />

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
              <span>Next unlock</span>
              <strong>{nextRewardName}</strong>
              <small>{nextRewardRequirement}</small>
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
        </aside>
      </section>

      <GearInventory avatar={avatarForProgress} regionProgress={regionProgress} onEquip={handleEquip} />
    </section>
  );
}
