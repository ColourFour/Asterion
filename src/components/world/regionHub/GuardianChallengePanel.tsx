import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
import type { GuardianChallenge } from '../../../data/guardianChallenges';
import { RegionActionCard } from './RegionActionCard';

interface GuardianChallengePanelProps {
  challenge?: GuardianChallenge;
  guardianCleared?: boolean;
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

export function GuardianChallengePanel({ challenge, guardianCleared = false, isUnlocked, regionName }: GuardianChallengePanelProps) {
  if (!challenge) {
    return (
      <RegionActionCard
        eyebrow="Step 3 · Guardian"
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

  const status = guardianCleared ? 'cleared' : isUnlocked ? 'ready' : 'locked';
  const statusCopy = {
    locked: {
      eyebrow: 'Step 3 · Final gate locked',
      description: `${regionName} is sealed. Save enough region practice to unlock the Guardian trial.`,
      label: 'Vault locked',
      title: `${regionName} is sealed`,
      body: 'The challenge opens after the guide and enough scored practice.',
      anticipation: 'The Guardian is waiting.',
      icon: <Lock size={22} aria-label="Guardian locked" />,
    },
    ready: {
      eyebrow: 'Step 3 · Guardian ready',
      description: `${regionName} is open. Your saved practice can launch the Guardian trial.`,
      label: 'Guardian ready',
      title: 'The gate is open',
      body: 'Enter the final region challenge when you are ready.',
      anticipation: 'Clear the region’s Guardian trial.',
      icon: <Sparkles size={22} aria-label="Guardian ready" />,
    },
    cleared: {
      eyebrow: 'Step 3 · Guardian cleared',
      description: `${regionName} has been restored by a saved Guardian clear.`,
      label: 'Region restored',
      title: 'Guardian trial cleared',
      body: 'The region is restored. Keep your evidence strong with later review.',
      anticipation: 'Guardian crest earned.',
      icon: <Sparkles size={22} aria-label="Guardian cleared" />,
    },
  }[status];

  return (
    <RegionActionCard
      eyebrow={statusCopy.eyebrow}
      title="Guardian Challenge"
      description={statusCopy.description}
      icon={<ShieldCheck size={22} />}
      stateIcon={statusCopy.icon}
      className={`guardian-card guardian-placeholder-card guardian-boss-card guardian-${status}-card`}
    >
      <section className="guardian-boss-hero" aria-label={`${regionName} Guardian gate`}>
        <div className="guardian-boss-copy">
          <span className="guardian-boss-kicker">{statusCopy.label}</span>
          <h4>{statusCopy.title}</h4>
          <p>{statusCopy.body}</p>
          <div className="guardian-locked-state" role="status">
            {status === 'locked' ? <Lock size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
            <div>
              <strong>{statusCopy.anticipation}</strong>
              <span>{status === 'locked' ? 'Do the next region task first; the challenge prompt stays hidden until then.' : 'The unlock details stay below so you know why this opened.'}</span>
            </div>
          </div>
        </div>
        <div className="guardian-boss-art">
          <GuardianArtwork challenge={challenge} regionName={regionName} />
          <span className="guardian-boss-lock" aria-hidden="true">
            {status === 'locked' ? <Lock size={38} /> : <ShieldCheck size={38} />}
          </span>
        </div>
      </section>
    </RegionActionCard>
  );
}
