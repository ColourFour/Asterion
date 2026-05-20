import { useState } from 'react';
import type { StudentProfile } from '../../types';

interface ProfileFormProps {
  profile?: StudentProfile;
  initialProfile?: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>;
  lockedClassFields?: boolean;
  onRestartClaim?: () => void;
  onSave: (profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ProfileForm({ profile, initialProfile, lockedClassFields = false, onRestartClaim, onSave }: ProfileFormProps) {
  const defaults = profile ?? initialProfile;
  const [realName, setRealName] = useState(defaults?.realName ?? '');
  const [classGroup, setClassGroup] = useState(defaults?.classGroup ?? '');
  const [teacherName, setTeacherName] = useState(defaults?.teacherName ?? '');
  const [avatarName, setAvatarName] = useState(defaults?.avatarName ?? '');

  return (
    <form
      className="profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ realName, classGroup, teacherName, avatarName, classClaim: defaults?.classClaim });
      }}
    >
      {!profile ? (
        <div className="profile-form-heading">
          <span className="mode-pill">Local profile</span>
          <h2>Name your academy character</h2>
          <p>After this, choose a region on the P3 map and start with its Field Guide.</p>
        </div>
      ) : null}
      <label>
        Student real name
        <input value={realName} onChange={(event) => setRealName(event.target.value)} required readOnly={lockedClassFields} />
      </label>
      <label>
        Class/group
        <input value={classGroup} onChange={(event) => setClassGroup(event.target.value)} required readOnly={lockedClassFields} />
      </label>
      <label>
        Teacher name
        <input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} required readOnly={lockedClassFields} />
      </label>
      {lockedClassFields ? (
        <div className="pending-claim-summary">
          <p className="claim-state-message">Class details came from the claimed roster slot for this browser profile.</p>
          {onRestartClaim ? (
            <button type="button" className="quiet-button compact-button" onClick={onRestartClaim}>Use a different class code</button>
          ) : null}
        </div>
      ) : null}
      <label>
        Character name
        <input value={avatarName} onChange={(event) => setAvatarName(event.target.value)} required />
      </label>
      <button className="primary-button" type="submit">
        {profile ? 'Update profile' : 'Enter Astral Academy'}
      </button>
    </form>
  );
}
