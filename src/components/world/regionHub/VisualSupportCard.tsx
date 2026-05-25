import { useState } from 'react';
import type { VisualSupportSource } from '../../../data/visualSupportSources';

interface VisualSupportCardProps {
  source: VisualSupportSource;
}

function visualSupportKindLabel(source: VisualSupportSource): string {
  if (source.visualKind === 'mini_diagram') return 'Mini-diagram';
  if (source.visualKind === 'method_pattern') return 'Method pattern';
  if (source.visualKind === 'needs_visual') return 'Needs visual';
  return 'No visual';
}

export function VisualSupportCard({ source }: VisualSupportCardProps) {
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const hasImage = Boolean(source.imageUrl.trim()) && !imageUnavailable;
  const hasAttribution = Boolean(source.sourceUrl.trim() && source.license.trim() && source.attribution.trim());

  return (
    <aside className="visual-support-card" aria-label={`${source.title} visual support`}>
      <div className="visual-support-copy">
        <span className="visual-support-kind">{visualSupportKindLabel(source)}</span>
        <strong>{source.title}</strong>
        <p>{source.purpose}</p>
      </div>
      {hasImage ? (
        <img
          src={source.imageUrl}
          alt={source.altText}
          loading="lazy"
          onError={() => setImageUnavailable(true)}
        />
      ) : (
        <p className="visual-support-unavailable">Visual preview unavailable. Use the source details for review.</p>
      )}
      <details className="visual-support-attribution">
        <summary>Source</summary>
        {hasAttribution ? (
          <p>
            {source.attribution}. {source.license}.{' '}
            <a href={source.sourceUrl} target="_blank" rel="noreferrer">View source</a>.
          </p>
        ) : (
          <p>Source details pending review. This visual should not render in student flow.</p>
        )}
      </details>
    </aside>
  );
}
