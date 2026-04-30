import type { AvatarSettings, TopicProfile } from '../../types';
import { checkmarkForRank } from '../../lib/mastery';

interface AvatarPanelProps {
  avatarName?: string;
  avatar: AvatarSettings;
  topicProfiles: Record<string, TopicProfile>;
  editable?: boolean;
  onChange?: (avatar: AvatarSettings) => void;
}

const palettes: AvatarSettings['palette'][] = ['ember', 'aqua', 'violet', 'leaf'];
const crests: AvatarSettings['crest'][] = ['star', 'bolt', 'compass', 'orb'];

export function AvatarPanel({ avatarName = 'Explorer', avatar, topicProfiles, editable = false, onChange }: AvatarPanelProps) {
  const ranks = Object.values(topicProfiles);
  const xp = ranks.reduce((sum, profile) => sum + profile.totalMarksEarned, 0);
  const unlockedGear = ranks.filter((profile) => profile.rank !== 'none').length;

  return (
    <aside className={`avatar-panel avatar-${avatar.palette}`}>
      <div className="avatar-figure" aria-label={`${avatarName} avatar`}>
        <svg viewBox="0 0 120 120" role="img">
          <circle className="avatar-back" cx="60" cy="60" r="52" />
          <path className="avatar-cloak" d="M30 102c4-28 16-42 30-42s26 14 30 42H30Z" />
          <circle className="avatar-face" cx="60" cy="42" r="22" />
          <path className="avatar-crest" d={avatar.crest === 'bolt' ? 'M64 10 43 58h17l-6 42 26-55H61Z' : avatar.crest === 'compass' ? 'M60 8 75 60 60 112 45 60Z' : avatar.crest === 'orb' ? 'M60 10a14 14 0 1 1 0 28 14 14 0 0 1 0-28Z' : 'M60 8l9 29 30 .1-24 17 9 29-24-18-24 18 9-29-24-17 30-.1Z'} />
        </svg>
      </div>
      <div>
        <strong>{avatarName}</strong>
        <span>{xp} XP · {unlockedGear} gear unlocks</span>
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
      <div className="topic-ranks">
        {ranks.slice(0, 4).map((profile) => (
          <span key={profile.topic}>{profile.topic}: {checkmarkForRank(profile.rank)}</span>
        ))}
      </div>
    </aside>
  );
}
