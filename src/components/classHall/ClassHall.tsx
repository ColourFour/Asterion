import { useMemo } from 'react';
import { CLASS_HALL_DEMO_AVATARS } from '../../data/classHallDemo';
import { normalizeClassHallAvatars, type ClassHallAvatarSnapshot } from '../../lib/classHall';
import { ClassHallCard } from './ClassHallCard';

interface ClassHallProps {
  avatars?: ClassHallAvatarSnapshot[];
}

export function ClassHall({ avatars = CLASS_HALL_DEMO_AVATARS }: ClassHallProps) {
  const classHallAvatars = useMemo(() => normalizeClassHallAvatars(avatars), [avatars]);

  return (
    <section className="class-hall-screen" aria-labelledby="class-hall-title">
      <header className="class-hall-header">
        <div>
          <span className="mode-pill">Academy Commons</span>
          <h2 id="class-hall-title">Class Hall</h2>
          <p>A local trophy-room gathering for academy avatars, house crests, earned cosmetics, and low-pressure badges.</p>
        </div>
        <aside className="class-hall-local-note" aria-label="Class Hall privacy note">
          Demo snapshots only. No marks, grades, weak topics, exact scores, or rankings.
        </aside>
      </header>

      {classHallAvatars.length ? (
        <div className="class-hall-grid" aria-label="Academy Commons avatar showcase">
          {classHallAvatars.map((avatar) => <ClassHallCard avatar={avatar} key={avatar.id} />)}
        </div>
      ) : (
        <div className="class-hall-empty" role="status">
          <strong>The Commons is quiet.</strong>
          <span>Avatar snapshots can be imported locally later without changing this view.</span>
        </div>
      )}
    </section>
  );
}
