import type { NextAvatarUnlock } from '../../lib/avatarUnlocks';

interface NextUnlockCardProps {
  nextUnlock?: NextAvatarUnlock;
}

export function NextUnlockCard({ nextUnlock }: NextUnlockCardProps) {
  if (!nextUnlock) {
    return (
      <article className="next-unlock-card is-complete">
        <span>Reward path complete</span>
        <h3>Academy Champion</h3>
        <p>All current avatar rewards are unlocked. Keep saving attempts to preserve the evidence trail.</p>
        <div className="next-unlock-meter" aria-label="All avatar rewards unlocked">
          <span style={{ width: '100%' }} />
        </div>
      </article>
    );
  }

  const percent = Math.round((nextUnlock.progress.current / nextUnlock.progress.required) * 100);

  return (
    <article className="next-unlock-card">
      <span>Next Unlock</span>
      <h3>{nextUnlock.item.name}</h3>
      <p>{nextUnlock.item.unlockText}</p>
      <div className="next-unlock-meter" aria-label={`${nextUnlock.progress.label} toward ${nextUnlock.item.name}`}>
        <span style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <strong>{nextUnlock.progress.label}</strong>
    </article>
  );
}
