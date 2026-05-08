import { useEffect, useState } from 'react';
import type { NextAvatarUnlock } from '../../lib/avatarUnlocks';
import { resolvePublicAssetPath } from '../../lib/resolveAssetPath';

interface NextUnlockCardProps {
  nextUnlock?: NextAvatarUnlock;
}

export function NextUnlockCard({ nextUnlock }: NextUnlockCardProps) {
  const [previewReady, setPreviewReady] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    setPreviewReady(false);
    setPreviewFailed(false);
  }, [nextUnlock?.item.id]);

  if (!nextUnlock) {
    return (
      <article className="next-unlock-card is-complete">
        <div className="next-unlock-preview" aria-hidden="true">
          <span>Complete</span>
        </div>
        <div className="next-unlock-copy">
          <span>Reward path complete</span>
          <h3>Academy Champion</h3>
          <p>All current avatar rewards are unlocked. Keep saving attempts to preserve the evidence trail.</p>
          <div className="next-unlock-meter" aria-label="All avatar rewards unlocked">
            <span style={{ width: '100%' }} />
          </div>
        </div>
      </article>
    );
  }

  const percent = Math.round((nextUnlock.progress.current / nextUnlock.progress.required) * 100);
  const previewSrc = resolvePublicAssetPath(nextUnlock.item.previewPath ?? nextUnlock.item.assetPath);

  return (
    <article className={`next-unlock-card rarity-${nextUnlock.item.rarity}`}>
      <div className="next-unlock-preview" aria-hidden="true">
        {previewSrc && !previewFailed ? (
          <img src={previewSrc} alt="" onLoad={() => setPreviewReady(true)} onError={() => setPreviewFailed(true)} />
        ) : null}
        {!previewReady || previewFailed ? <span>{nextUnlock.item.silhouette ?? nextUnlock.item.displayName}</span> : null}
      </div>
      <div className="next-unlock-copy">
        <span>Next Unlock</span>
        <h3>{nextUnlock.item.displayName}</h3>
        <p>{nextUnlock.item.unlockText}</p>
        <div className="next-unlock-meter" aria-label={`${nextUnlock.progress.label} toward ${nextUnlock.item.displayName}`}>
          <span style={{ width: `${Math.min(100, percent)}%` }} />
        </div>
        <strong>{nextUnlock.progress.label}</strong>
      </div>
    </article>
  );
}
