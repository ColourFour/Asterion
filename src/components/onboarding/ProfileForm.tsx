import { useState } from 'react';
import type { StudentProfile } from '../../types';

interface ProfileFormProps {
  profile?: StudentProfile;
  onSave: (profile: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [realName, setRealName] = useState(profile?.realName ?? '');
  const [classGroup, setClassGroup] = useState(profile?.classGroup ?? '');
  const [teacherName, setTeacherName] = useState(profile?.teacherName ?? '');
  const [avatarName, setAvatarName] = useState(profile?.avatarName ?? '');

  return (
    <form
      className="profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ realName, classGroup, teacherName, avatarName });
      }}
    >
      <label>
        Student real name
        <input value={realName} onChange={(event) => setRealName(event.target.value)} required />
      </label>
      <label>
        Class/group
        <input value={classGroup} onChange={(event) => setClassGroup(event.target.value)} required />
      </label>
      <label>
        Teacher name
        <input value={teacherName} onChange={(event) => setTeacherName(event.target.value)} required />
      </label>
      <label>
        Character name
        <input value={avatarName} onChange={(event) => setAvatarName(event.target.value)} required />
      </label>
      <button className="primary-button" type="submit">
        Enter practice
      </button>
    </form>
  );
}
