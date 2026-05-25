import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
import type { GuardianChallenge } from '../../../data/guardianChallenges';
import { RegionActionCard } from './RegionActionCard';

interface GuardianChallengePanelProps {
  challenge?: GuardianChallenge;
  isUnlocked: boolean;
  regionName: string;
}

function GuardianArtwork({ challenge, regionName }: { challenge: GuardianChallenge; regionName: string }) {
  if (challenge.guardianAssetPath) {
    return (
      <figure className="guardian-placeholder-figure guardian-artwork-frame">
        <img src={challenge.guardianAssetPath} alt={`${regionName} Guardian artwork`} loading="lazy" />
      </figure>
    );
  }

  return (
    <div className="guardian-placeholder-missing-art" role="status">
      Guardian artwork is not available for this region yet.
    </div>
  );
}

export function GuardianChallengePanel({ challenge, isUnlocked, regionName }: GuardianChallengePanelProps) {
  if (!challenge) {
    return (
      <RegionActionCard
        eyebrow="Step 4 · Guardian"
        title="Guardian Challenge"
        description="Guardian artwork will appear here when this region has artwork available."
        icon={<ShieldCheck size={22} />}
        className="guardian-card guardian-placeholder-card"
      >
        <p className="guardian-placeholder-warning">
          Guardian artwork is not available for this region yet. This does not affect practice.
        </p>
      </RegionActionCard>
    );
  }

  if (!isUnlocked) {
    return (
      <RegionActionCard
        eyebrow="Step 4 · Guardian locked"
        title="Guardian Challenge"
        description={`${regionName} Guardian challenge is short, special, and unlocks after the required saved practice evidence is complete.`}
        icon={<ShieldCheck size={22} />}
        stateIcon={<Lock size={22} aria-label="Guardian locked" />}
        className="guardian-card guardian-placeholder-card guardian-locked-card"
      >
        <GuardianArtwork challenge={challenge} regionName={regionName} />
        <div className="guardian-locked-state" role="status">
          <Lock size={20} aria-hidden="true" />
          <div>
            <strong>Guardian challenge locked</strong>
            <span>Complete the Step 4 prerequisites first. The challenge question and answer controls are hidden until the Guardian unlocks.</span>
          </div>
        </div>
      </RegionActionCard>
    );
  }

  return (
    <RegionActionCard
      eyebrow="Step 4 · Guardian ready"
      title="Guardian Challenge"
      description={`${regionName} Guardian challenge is ready.`}
      icon={<Sparkles size={22} />}
      className="guardian-card guardian-placeholder-card"
    >
      <GuardianArtwork challenge={challenge} regionName={regionName} />
      <div className="guardian-locked-state" role="status">
        <Sparkles size={20} aria-hidden="true" />
        <div>
          <strong>Guardian challenge ready</strong>
          <span>Use the Guardian evidence card below to open the actual question.</span>
        </div>
      </div>
    </RegionActionCard>
  );
}
