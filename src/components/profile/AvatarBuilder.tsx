import type { AvatarSettings, AvatarGear, RegionProgress, StudentProfile } from '../../types';
import { AVATAR_SLOT_LABELS, AVATAR_SLOTS, type AvatarItem } from '../../data/avatarCatalog';
import { calculateAcademySummary } from '../../lib/academyProgress';
import { getAvatarLayers } from '../../lib/avatarLayers';
import { equipAvatarItem, normalizeAvatarSettings } from '../../lib/avatarStore';
import { selectNextAvatarUnlock } from '../../lib/avatarUnlocks';
import { ProfileForm } from '../onboarding/ProfileForm';
import { AvatarPreview } from './AvatarPreview';
import { GearInventory } from './GearInventory';
import { NextUnlockCard } from './NextUnlockCard';

interface AvatarBuilderProps {
  profile: StudentProfile;
  avatar: AvatarSettings;
  avatarGear: AvatarGear;
  regionProgress: RegionProgress[];
  onAvatarChange: (avatar: AvatarSettings) => void;
  onProfileSave: (profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const palettes: AvatarSettings['palette'][] = ['ember', 'aqua', 'violet', 'leaf'];
const crests: AvatarSettings['crest'][] = ['star', 'bolt', 'compass', 'orb'];
const leftStageSlots = AVATAR_SLOTS.slice(0, 5);
const rightStageSlots = AVATAR_SLOTS.slice(5);

export function AvatarBuilder({ profile, avatar, avatarGear, regionProgress, onAvatarChange, onProfileSave }: AvatarBuilderProps) {
  const summary = calculateAcademySummary(regionProgress);
  const avatarForProgress = normalizeAvatarSettings(avatar, regionProgress);
  const equippedLayers = getAvatarLayers(avatarForProgress, regionProgress);
  const nextUnlock = selectNextAvatarUnlock(regionProgress);

  function handleEquip(item: AvatarItem) {
    onAvatarChange(equipAvatarItem(avatarForProgress, item, regionProgress));
  }

  return (
    <section className="avatar-builder-page" aria-labelledby="avatar-builder-title">
      <header className="avatar-builder-header">
        <span className="mode-pill">Character sheet</span>
        <h2 id="avatar-builder-title">Avatar Builder</h2>
        <p>Equip mastery rewards earned from real region progress, then use the character sheet as your academy identity.</p>
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

          <section className="avatar-finish-panel" aria-labelledby="avatar-finish-title">
            <h3 id="avatar-finish-title">Character Finish</h3>
            <label>
              Palette
              <select value={avatarForProgress.palette} onChange={(event) => onAvatarChange({ ...avatarForProgress, palette: event.target.value as AvatarSettings['palette'] })}>
                {palettes.map((palette) => <option key={palette} value={palette}>{palette}</option>)}
              </select>
            </label>
            <label>
              Crest
              <select value={avatarForProgress.crest} onChange={(event) => onAvatarChange({ ...avatarForProgress, crest: event.target.value as AvatarSettings['crest'] })}>
                {crests.map((crest) => <option key={crest} value={crest}>{crest}</option>)}
              </select>
            </label>
          </section>

          <details className="student-details-panel">
            <summary>Student Details</summary>
            <ProfileForm profile={profile} onSave={onProfileSave} />
          </details>
        </aside>
      </section>

      <GearInventory avatar={avatarForProgress} regionProgress={regionProgress} onEquip={handleEquip} />
    </section>
  );
}
