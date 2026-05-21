import { useState, type FormEvent } from 'react';
import { ACADEMY_AVATAR_PRESETS } from '../../lib/studentOnboarding';
import type { AvatarSettings, StudentProfile } from '../../types';
import { AvatarPreview } from '../profile/AvatarPreview';
import { TwinklingStarfield } from '../shared/TwinklingStarfield';

interface StudentOnboardingProps {
  profile: StudentProfile;
  onComplete: (input: { avatarName: string; avatarId: string; avatar: AvatarSettings }) => void;
}

export function StudentOnboarding({ profile, onComplete }: StudentOnboardingProps) {
  const initialAvatarId = profile.avatarId ?? ACADEMY_AVATAR_PRESETS[0].id;
  const [academyName, setAcademyName] = useState(profile.avatarName);
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const selectedPreset = ACADEMY_AVATAR_PRESETS.find((preset) => preset.id === avatarId) ?? ACADEMY_AVATAR_PRESETS[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = academyName.trim();
    if (!trimmedName) return;
    onComplete({ avatarName: trimmedName, avatarId: selectedPreset.id, avatar: selectedPreset.avatar });
  }

  return (
    <main className="app-shell onboarding-shell student-onboarding-shell">
      <TwinklingStarfield />
      <section className="student-onboarding-panel" aria-labelledby="student-onboarding-title">
        <span className="mode-pill">First day at Asterion Academy</span>
        <h1 id="student-onboarding-title">Welcome to Asterion Academy</h1>
        <p>
          This is a training world for mastering Pure Mathematics 3.
          Each region teaches a different part of the course.
        </p>
        <div className="academy-path-grid" aria-label="Academy training path">
          <span>Field Guide</span>
          <span>Quick Check</span>
          <span>Warm-Up</span>
          <span>Exam Questions</span>
          <span>Guardian Challenge</span>
        </div>
        <p>
          Study the guide, build confidence, then train with real exam-question images.
          First, create your academy avatar.
        </p>
      </section>

      <form className="profile-form academy-avatar-form" onSubmit={handleSubmit} aria-label="Create academy avatar">
        <div className="profile-form-heading">
          <span className="mode-pill">Academy profile</span>
          <h2>Create your avatar</h2>
          <p>Your class access and progress rules stay the same. This only sets your student profile.</p>
        </div>

        <label>
          Academy name
          <input value={academyName} onChange={(event) => setAcademyName(event.target.value)} required maxLength={40} />
        </label>

        <fieldset className="avatar-preset-grid">
          <legend>Choose a starter avatar</legend>
          {ACADEMY_AVATAR_PRESETS.map((preset) => (
            <label className={`avatar-preset-card${preset.id === selectedPreset.id ? ' selected' : ''}`} key={preset.id}>
              <input
                checked={preset.id === selectedPreset.id}
                name="academy-avatar"
                onChange={() => setAvatarId(preset.id)}
                type="radio"
                value={preset.id}
              />
              <AvatarPreview avatarName={academyName || profile.avatarName} avatar={preset.avatar} regionProgress={[]} />
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </label>
          ))}
        </fieldset>

        <div className="academy-avatar-preview" aria-label="Selected academy profile">
          <AvatarPreview avatarName={academyName || profile.avatarName} avatar={selectedPreset.avatar} regionProgress={[]} />
          <div>
            <span>Ready for the map</span>
            <strong>{academyName || profile.avatarName}</strong>
            <small>{selectedPreset.label}</small>
          </div>
        </div>

        <button className="primary-button" type="submit">Enter the P3 world map</button>
      </form>
    </main>
  );
}
