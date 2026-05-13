import { useState } from 'react';
import { AvatarRenderer } from '../avatar/AvatarRenderer';
import type { ClassHallAvatar } from '../../lib/classHall';

interface ClassHallCardProps {
  avatar: ClassHallAvatar;
}

export function ClassHallCard({ avatar }: ClassHallCardProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileId = `class-hall-profile-${avatar.id}`;
  const visibleCosmetics = avatar.equippedCosmetics.slice(0, 4);

  return (
    <article className={`class-hall-card${isProfileOpen ? ' is-profile-open' : ''}`} data-class-hall-card={avatar.id}>
      <div className="class-hall-avatar-frame">
        <AvatarRenderer
          avatarName={avatar.nickname}
          avatar={avatar.avatar}
          mode="portrait"
          ariaLabel={`${avatar.nickname} Class Hall avatar`}
        />
      </div>

      <div className="class-hall-card-heading">
        {avatar.house ? <span className={`student-crest student-crest-${avatar.house.crest ?? avatar.avatar.crest}`} aria-hidden="true" /> : null}
        <div>
          <h3>{avatar.nickname}</h3>
          {avatar.house ? <span>{avatar.house.name}</span> : null}
        </div>
      </div>

      <div className="class-hall-achievements" aria-label={`${avatar.nickname} showcase badges`}>
        {avatar.achievements.length
          ? avatar.achievements.map((achievement) => <span key={achievement}>{achievement}</span>)
          : <span>New Class Hall Visitor</span>}
      </div>

      <ul className="class-hall-cosmetics" aria-label={`${avatar.nickname} equipped cosmetics`}>
        {visibleCosmetics.map((cosmetic) => <li key={cosmetic}>{cosmetic}</li>)}
      </ul>

      <button
        type="button"
        className="class-hall-profile-toggle"
        aria-expanded={isProfileOpen}
        aria-controls={profileId}
        onClick={() => setIsProfileOpen((current) => !current)}
      >
        {isProfileOpen ? 'Close profile' : 'View profile'}
      </button>

      <div className="class-hall-profile-card" id={profileId} aria-label={`${avatar.nickname} non-sensitive profile`}>
        <strong>{avatar.nickname}</strong>
        {avatar.house ? <span>{avatar.house.name}</span> : null}
        {avatar.favoriteRegion ? <span>Favorite wing: {avatar.favoriteRegion}</span> : null}
        {avatar.motto ? <p>{avatar.motto}</p> : null}
        <div className="class-hall-profile-cosmetics">
          {avatar.equippedCosmetics.slice(0, 6).map((cosmetic) => <span key={cosmetic}>{cosmetic}</span>)}
        </div>
      </div>
    </article>
  );
}
