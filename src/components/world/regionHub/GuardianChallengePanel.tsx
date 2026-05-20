import { useState } from 'react';
import { Eye, ShieldCheck, Sparkles } from 'lucide-react';
import type { GuardianChallenge } from '../../../data/guardianChallenges';
import { MathText } from '../../shared/MathText';
import { RegionActionCard } from './RegionActionCard';

interface GuardianChallengePanelProps {
  challenge?: GuardianChallenge;
  regionName: string;
}

export function GuardianChallengePanel({ challenge, regionName }: GuardianChallengePanelProps) {
  const [draft, setDraft] = useState('');
  const [guidanceRevealed, setGuidanceRevealed] = useState(false);

  if (!challenge) {
    return (
      <RegionActionCard
        eyebrow="Step 5 · Pilot"
        title="Stretch Guardian Challenge"
        description="A boss-style placeholder challenge will appear here when this region has pilot content."
        icon={<ShieldCheck size={22} />}
        className="guardian-card guardian-placeholder-card"
      >
        <p className="guardian-placeholder-warning">
          Placeholder Guardian content is missing for this region. This does not affect official P3 practice or mastery evidence.
        </p>
      </RegionActionCard>
    );
  }

  const guidanceId = `guardian-placeholder-guidance-${challenge.regionId}`;

  return (
    <RegionActionCard
      eyebrow="Step 5 · Pilot placeholder"
      title="Stretch Guardian Challenge"
      description={`${regionName} boss problem for the pilot version.`}
      icon={<Sparkles size={22} />}
      className="guardian-card guardian-placeholder-card"
    >
      <div className="guardian-placeholder-warning" role="note">
        <strong>Placeholder challenge</strong>
        <span>{challenge.studentFacingWarning}</span>
      </div>

      <article className="guardian-placeholder-problem">
        <div className="guardian-placeholder-heading">
          <span>{challenge.topicLabel}</span>
          <h4>{challenge.title}</h4>
        </div>
        <p className="guardian-placeholder-prompt">
          <MathText text={challenge.prompt} />
        </p>

        {challenge.guardianAssetPath ? (
          <figure className="guardian-placeholder-figure">
            <img src={challenge.guardianAssetPath} alt={`${regionName} Guardian artwork`} loading="lazy" />
          </figure>
        ) : (
          <div className="guardian-placeholder-missing-art" role="status">
            Guardian artwork is not available for this region yet.
          </div>
        )}
      </article>

      <label className="activity-response-field guardian-placeholder-response">
        <span>Draft your answer or method</span>
        <textarea
          value={draft}
          rows={5}
          placeholder="Write your setup, key equations, checks, and final answer here."
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>

      <button
        className="activity-primary-action guardian-placeholder-reveal"
        type="button"
        aria-expanded={guidanceRevealed}
        aria-controls={guidanceId}
        onClick={() => setGuidanceRevealed(true)}
      >
        <Eye size={18} aria-hidden="true" />
        Reveal placeholder guidance
      </button>

      {guidanceRevealed ? (
        <div className="guardian-placeholder-guidance" id={guidanceId}>
          <strong>Placeholder guidance</strong>
          <p>This is placeholder guidance for the pilot version. Your teacher may discuss the official approach later.</p>
          <ul>
            {challenge.guidance.map((item) => (
              <li key={item}><MathText text={item} /></li>
            ))}
          </ul>
          <small>Revealing this does not save official P3 mastery evidence or clear the reviewed Guardian check.</small>
        </div>
      ) : null}
    </RegionActionCard>
  );
}
