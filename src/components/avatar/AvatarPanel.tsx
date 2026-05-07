import type { AvatarGear, AvatarSettings, TopicProfile } from '../../types';
import { checkmarkForRank } from '../../lib/mastery';

interface AvatarPanelProps {
  avatarName?: string;
  avatar: AvatarSettings;
  topicProfiles: Record<string, TopicProfile>;
  gear?: AvatarGear;
  editable?: boolean;
  onChange?: (avatar: AvatarSettings) => void;
}

const palettes: AvatarSettings['palette'][] = ['ember', 'aqua', 'violet', 'leaf'];
const crests: AvatarSettings['crest'][] = ['star', 'bolt', 'compass', 'orb'];

export function AvatarPanel({ avatarName = 'Explorer', avatar, topicProfiles, gear, editable = false, onChange }: AvatarPanelProps) {
  const ranks = Object.values(topicProfiles);
  const xp = ranks.reduce((sum, profile) => sum + profile.totalMarksEarned, 0);
  const unlockedGear = gear?.gear.length ?? ranks.filter((profile) => profile.rank !== 'none').length;
  const gearProgress = Math.round((unlockedGear / 6) * 100);
  const hasGear = (name: string) => Boolean(gear?.gear.includes(name));

  return (
    <aside className={`avatar-panel avatar-${avatar.palette}`}>
      <div className="avatar-stage">
        <div className="avatar-figure">
        <svg viewBox="0 0 120 120" role="img" aria-label={`${avatarName} avatar`}>
          <circle className="avatar-back" cx="60" cy="60" r="52" />
          {hasGear('Astral Trim') ? <circle className="avatar-trim" cx="60" cy="60" r="47" /> : null}
          <path className="avatar-cloak" d="M30 102c4-28 16-42 30-42s26 14 30 42H30Z" />
          <circle className="avatar-face" cx="60" cy="42" r="22" />
          {hasGear('Archive Gauntlets') ? <path className="avatar-gauntlets" d="M26 92h14v16H26zM80 92h14v16H80z" /> : null}
          {hasGear('Star Lens') ? <path className="avatar-lens" d="M49 40h11m0 0a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm11 0h8" /> : null}
          {hasGear('Argand Compass') ? <path className="avatar-compass" d="M60 68 70 88 60 82 50 88Z" /> : null}
          <path className="avatar-crest" d={avatar.crest === 'bolt' ? 'M64 10 43 58h17l-6 42 26-55H61Z' : avatar.crest === 'compass' ? 'M60 8 75 60 60 112 45 60Z' : avatar.crest === 'orb' ? 'M60 10a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z' : 'M60 8l9 29 30 .1-24 17 9 29-24-18-24 18 9-29-24-17 30-.1Z'} />
        </svg>
        </div>
        <span className="avatar-level-seal">{unlockedGear}/6 gear</span>
      </div>
      <div className="avatar-body">
        <div className="avatar-heading">
          <div>
            <strong>{avatarName}</strong>
            <span>{gear?.title ?? 'New Arrival'}</span>
          </div>
          <span className="avatar-xp">{xp} XP</span>
        </div>
        <div className="avatar-progress-track" aria-label={`${gearProgress}% of current avatar gear path unlocked`}>
          <span style={{ width: `${gearProgress}%` }} />
        </div>
        <div className="avatar-growth">
          <span>{gear?.restoredRegions ?? 0} restored · {gear?.goldRegions ?? 0} gold</span>
          {gear?.strongestRegionName ? <span>Strongest wing: {gear.strongestRegionName} ({gear.strongestRegionRank})</span> : null}
        </div>
        {gear?.nextUnlock ? (
          <div className="avatar-next-unlock">
            <span>Next character upgrade</span>
            <strong>{gear.nextUnlock}</strong>
            <p>{gear.nextUnlockRequirement}</p>
          </div>
        ) : (
          <div className="avatar-next-unlock">
            <span>Character path complete</span>
            <strong>Academy Champion</strong>
            <p>Keep proving mastery through mixed review and teacher evidence.</p>
          </div>
        )}
      </div>
      {editable ? (
        <div className="avatar-controls">
          <select value={avatar.palette} onChange={(event) => onChange?.({ ...avatar, palette: event.target.value as AvatarSettings['palette'] })}>
            {palettes.map((palette) => <option key={palette}>{palette}</option>)}
          </select>
          <select value={avatar.crest} onChange={(event) => onChange?.({ ...avatar, crest: event.target.value as AvatarSettings['crest'] })}>
            {crests.map((crest) => <option key={crest}>{crest}</option>)}
          </select>
        </div>
      ) : null}
      <div className="avatar-gear-list" aria-label="Unlocked avatar gear">
        {gear?.gear.length ? gear.gear.map((item) => <span key={item}>{item}</span>) : <span>No gear unlocked yet</span>}
      </div>
      <div className="topic-ranks">
        {ranks.slice(0, 4).map((profile) => (
          <span key={profile.topic}>{profile.topic}: {checkmarkForRank(profile.rank)}</span>
        ))}
      </div>
    </aside>
  );
}
