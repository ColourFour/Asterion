import { useMemo, useState } from 'react';
import { AVATAR_CATALOG, AVATAR_CATEGORIES, type AvatarItem, type AvatarItemCategory } from '../../data/avatarCatalog';
import { getAvatarUnlockProgress } from '../../lib/avatarUnlocks';
import { normalizeEquippedItems } from '../../lib/avatarStore';
import type { AvatarSettings, RegionProgress } from '../../types';
import { AvatarItemCard, type AvatarItemStatus } from './AvatarItemCard';

interface GearInventoryProps {
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
  onEquip: (item: AvatarItem) => void;
}

function statusForItem(item: AvatarItem, avatar: AvatarSettings, regionProgress: RegionProgress[]): AvatarItemStatus {
  const progress = getAvatarUnlockProgress(item, regionProgress);
  if (!progress.unlocked) return 'locked';
  const equipped = normalizeEquippedItems(avatar.equipped, regionProgress);
  return equipped[item.slot] === item.id ? 'equipped' : 'unlocked';
}

export function GearInventory({ avatar, regionProgress, onEquip }: GearInventoryProps) {
  const [activeCategory, setActiveCategory] = useState<AvatarItemCategory>('Appearance');
  const categoryItems = useMemo(
    () => AVATAR_CATALOG.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  return (
    <section className="gear-inventory" aria-labelledby="gear-inventory-title">
      <div className="gear-inventory-heading">
        <div>
          <span className="mode-pill">Reward inventory</span>
          <h3 id="gear-inventory-title">Avatar Gear</h3>
        </div>
        <p>Unlocked rewards can be equipped now. Locked rewards stay visible so the next mastery target is clear.</p>
      </div>
      <div className="gear-tabs" role="tablist" aria-label="Avatar gear categories">
        {AVATAR_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            className={activeCategory === category ? 'active' : ''}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="gear-grid">
        {categoryItems.map((item) => (
          <AvatarItemCard
            key={item.id}
            item={item}
            status={statusForItem(item, avatar, regionProgress)}
            progress={getAvatarUnlockProgress(item, regionProgress)}
            onEquip={onEquip}
          />
        ))}
      </div>
    </section>
  );
}
