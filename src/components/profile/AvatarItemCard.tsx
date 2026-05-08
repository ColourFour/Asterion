import { AVATAR_SLOT_LABELS, type AvatarItem } from '../../data/avatarCatalog';
import type { AvatarUnlockProgress } from '../../lib/avatarUnlocks';

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

  return (
    <article className={`avatar-item-card item-${status}`}>
      <div className="avatar-item-preview" aria-hidden="true">
        <span>{item.silhouette ?? item.name}</span>
      </div>
      <div className="avatar-item-copy">
        <div>
          <span className="avatar-item-slot">{AVATAR_SLOT_LABELS[item.slot]}</span>
          <h4>{item.name}</h4>
        </div>
        <p>{item.description}</p>
        <span className="avatar-item-requirement">{item.unlockText}</span>
        <span className="avatar-item-progress">{progress.label}</span>
      </div>
      <button type="button" disabled={locked || equipped} onClick={() => onEquip(item)}>
        {equipped ? 'Equipped' : locked ? 'Locked' : 'Equip'}
      </button>
    </article>
  );
}
