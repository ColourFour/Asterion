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
  const displayName = academyName.trim() || profile.avatarName.trim() || profile.realName.trim() || 'Asterion Student';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onComplete({ avatarName: displayName, avatarId: selectedPreset.id, avatar: selectedPreset.avatar });
  }

  return (
    <main className="app-shell onboarding-shell student-onboarding-shell">
      <TwinklingStarfield />
      <section className="student-onboarding-panel" aria-labelledby="student-onboarding-title">
        <span className="mode-pill">First day at Asterion Academy</span>
        <h1 id="student-onboarding-title">Choose your academy avatar</h1>
        <p>Pick a starter look. Your class, roster name, and progress rules stay the same.</p>
      </section>

      <form className="profile-form academy-avatar-form" onSubmit={handleSubmit} aria-label="Create academy avatar">
        <div className="profile-form-heading">
          <span className="mode-pill">Academy profile</span>
          <h2>{displayName}</h2>
          <p>Choose one avatar, then enter the P3 world map.</p>
        </div>

        <label>
          Academy name
          <input value={academyName} onChange={(event) => setAcademyName(event.target.value)} maxLength={40} />
        </label>

        <fieldset className="avatar-preset-grid">
          <legend>Choose a starter avatar</legend>
          {ACADEMY_AVATAR_PRESETS.map((preset) => (
            <label
              aria-label={`${preset.label}${preset.id === selectedPreset.id ? ', selected' : ''}`}
              className={`avatar-preset-card${preset.id === selectedPreset.id ? ' selected' : ''}`}
              data-selected={preset.id === selectedPreset.id ? 'true' : undefined}
              key={preset.id}
            >
              <input
                checked={preset.id === selectedPreset.id}
                name="academy-avatar"
                onChange={() => setAvatarId(preset.id)}
                type="radio"
                value={preset.id}
              />
              <AvatarPreview avatarName={displayName} avatar={preset.avatar} regionProgress={[]} />
              <strong>{preset.label}</strong>
              {preset.id === selectedPreset.id ? <span className="selected-avatar-badge">Selected</span> : null}
              <span>{preset.description}</span>
            </label>
          ))}
        </fieldset>

        <div className="academy-avatar-preview" aria-label="Selected academy profile">
          <AvatarPreview avatarName={displayName} avatar={selectedPreset.avatar} regionProgress={[]} />
          <div>
            <span>Ready for the map</span>
            <strong>{displayName}</strong>
            <small>{selectedPreset.label}</small>
          </div>
        </div>

        <button className="primary-button" type="submit">Enter the P3 world map</button>
      </form>
    </main>
  );
}
