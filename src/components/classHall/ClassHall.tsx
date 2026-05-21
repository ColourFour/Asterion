import { useMemo } from 'react';
import { CLASS_HALL_DEMO_AVATARS } from '../../data/classHallDemo';
import { normalizeClassHallAvatars, type ClassHallAvatarSnapshot } from '../../lib/classHall';
import { ClassHallCard } from './ClassHallCard';

interface ClassHallProps {
  avatars?: ClassHallAvatarSnapshot[];
  currentStudentAvatar?: ClassHallAvatarSnapshot;
}

export function ClassHall({ avatars = CLASS_HALL_DEMO_AVATARS, currentStudentAvatar }: ClassHallProps) {
  const classHallAvatars = useMemo(() => normalizeClassHallAvatars([
    ...(currentStudentAvatar ? [currentStudentAvatar] : []),
    ...avatars,
  ]), [avatars, currentStudentAvatar]);

  return (
    <section className="class-hall-screen" aria-labelledby="class-hall-title">
      <header className="class-hall-header">
        <div>
          <span className="mode-pill">Class Hall</span>
          <h2 id="class-hall-title">Class Hall</h2>
          <p>A browser-only avatar showcase for cosmetics and low-pressure badges.</p>
        </div>
        <aside className="class-hall-local-note" aria-label="Class Hall privacy note">
          Hosted teacher summaries are separate. This showcase does not sync marks, weak topics, exact scores, rankings, or official grades.
        </aside>
      </header>

      {classHallAvatars.length ? (
        <div className="class-hall-grid" aria-label="Class Hall avatar showcase">
          {classHallAvatars.map((avatar) => <ClassHallCard avatar={avatar} key={avatar.id} />)}
        </div>
      ) : (
        <div className="class-hall-empty" role="status">
          <strong>The Class Hall is quiet.</strong>
          <span>No local avatar snapshots are stored in this browser yet.</span>
        </div>
      )}
    </section>
  );
}
