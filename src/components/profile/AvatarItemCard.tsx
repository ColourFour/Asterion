import { useState } from 'react';
import { AVATAR_SLOT_LABELS, type AvatarItem } from '../../data/avatarCatalog';
import type { AvatarUnlockProgress } from '../../lib/avatarUnlocks';
import { resolvePublicAssetPath } from '../../lib/resolveAssetPath';

export type AvatarItemStatus = 'locked' | 'unlocked' | 'equipped';

interface AvatarItemCardProps {
  item: AvatarItem;
  status: AvatarItemStatus;
  progress: AvatarUnlockProgress;
  onEquip: (item: AvatarItem) => void;
}

export function AvatarItemCard({ item, status, progress, onEquip }: AvatarItemCardProps) {
  const locked = status === 'locked';
  const equipped = status === 'equipped';
  const [previewReady, setPreviewReady] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewSrc = resolvePublicAssetPath(item.previewPath ?? item.assetPath);
  const percent = progress.required > 0 ? Math.round((progress.current / progress.required) * 100) : 0;

  return (
    <article className={`avatar-item-card item-${status} rarity-${item.rarity}`}>
      <div className="avatar-item-preview" aria-hidden="true">
        {previewSrc && !previewFailed ? (
          <img src={previewSrc} alt="" onLoad={() => setPreviewReady(true)} onError={() => setPreviewFailed(true)} />
        ) : null}
        {!previewReady || previewFailed ? <span>{item.silhouette ?? item.displayName}</span> : null}
        {locked ? <strong>Locked preview</strong> : null}
      </div>
      <div className="avatar-item-copy">
        <div>
          <span className="avatar-item-slot">{AVATAR_SLOT_LABELS[item.slot]}</span>
          <h4>{item.displayName}</h4>
        </div>
        <p>{item.description}</p>
        <span className="avatar-item-rarity">{item.rarity}</span>
        <span className="avatar-item-requirement">{item.unlockText}</span>
        {locked ? (
          <span className="avatar-item-mini-meter" aria-label={`${progress.label} toward ${item.displayName}`}>
            <span style={{ width: `${Math.min(100, percent)}%` }} />
          </span>
        ) : null}
        <span className="avatar-item-progress">{progress.label}</span>
      </div>
      <button type="button" disabled={locked || equipped} onClick={() => onEquip(item)}>
        {equipped ? 'Equipped' : locked ? 'Locked' : 'Equip'}
      </button>
    </article>
  );
}
