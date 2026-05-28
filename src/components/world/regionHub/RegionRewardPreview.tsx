import { Trophy } from 'lucide-react';

interface RegionRewardPreviewProps {
  guardianCleared: boolean;
  regionName: string;
}

export function RegionRewardPreview({ guardianCleared, regionName }: RegionRewardPreviewProps) {
  return (
    <aside className={`region-reward-preview${guardianCleared ? ' reward-unlocked' : ''}`} aria-label="Mastery and reward preview">
      <Trophy size={22} />
      <div>
        <span>{guardianCleared ? 'Reward unlocked' : 'Mastery / reward preview'}</span>
        <strong>{regionName} restoration sigil</strong>
        <p>{guardianCleared ? 'Region restored. Maintain mastery here through later review or move to another region.' : 'Field Guide and practice steps can earn XP. Real rewards stay placeholder-only until the reward system is ready.'}</p>
      </div>
    </aside>
  );
}
