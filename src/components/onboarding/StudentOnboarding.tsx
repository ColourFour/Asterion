import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ACADEMY_AVATAR_PRESETS } from '../../lib/studentOnboarding';
import type { AvatarSettings, StudentProfile } from '../../types';
import { AvatarPreview } from '../profile/AvatarPreview';
import { TwinklingStarfield } from '../shared/TwinklingStarfield';

interface StudentOnboardingProps {
  profile: StudentProfile;
  onComplete: (input: { avatarName: string; avatarId: string; avatar: AvatarSettings }) => void;
}

type OnboardingStep = 'welcome' | 'name' | 'avatar';

const onboardingSteps: { id: OnboardingStep; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'name', label: 'Name' },
  { id: 'avatar', label: 'Avatar' },
];

export function StudentOnboarding({ profile, onComplete }: StudentOnboardingProps) {
  const initialAvatarId = profile.avatarId ?? ACADEMY_AVATAR_PRESETS[0].id;
  const [activeStep, setActiveStep] = useState<OnboardingStep>('welcome');
  const [academyName, setAcademyName] = useState(profile.avatarName);
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const selectedPreset = ACADEMY_AVATAR_PRESETS.find((preset) => preset.id === avatarId) ?? ACADEMY_AVATAR_PRESETS[0];
  const displayName = academyName.trim() || profile.avatarName.trim() || profile.realName.trim() || 'Asterion Student';
  const activeStepIndex = onboardingSteps.findIndex((step) => step.id === activeStep);
  const canGoBack = activeStepIndex > 0;

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [activeStep]);

  function goToStep(step: OnboardingStep) {
    setActiveStep(step);
  }

  function goNext() {
    const nextStep = onboardingSteps[Math.min(activeStepIndex + 1, onboardingSteps.length - 1)];
    goToStep(nextStep.id);
  }

  function goBack() {
    const previousStep = onboardingSteps[Math.max(activeStepIndex - 1, 0)];
    goToStep(previousStep.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeStep !== 'avatar') {
      goNext();
      return;
    }
    onComplete({ avatarName: displayName, avatarId: selectedPreset.id, avatar: selectedPreset.avatar });
  }

  return (
    <main className="app-shell onboarding-shell student-onboarding-shell">
      <TwinklingStarfield />
      <form className="profile-form academy-avatar-form academy-onboarding-stepper" onSubmit={handleSubmit} aria-label="Create academy avatar">
        <div className="academy-stepper-header">
          <span className="mode-pill">First day at Asterion Academy</span>
          <h1 id="student-onboarding-title" ref={stepHeadingRef} tabIndex={-1}>
            {activeStep === 'welcome' ? 'Choose your academy avatar' : activeStep === 'name' ? 'Name your academy profile' : 'Choose a starter avatar'}
          </h1>
          <p>
            {activeStep === 'welcome'
              ? 'Pick a starter look. Your class, roster name, and progress rules stay the same.'
              : activeStep === 'name'
                ? 'Use an academy name on the map. Leave it blank to keep your current character name.'
                : 'Choose one avatar, then enter the P3 world map.'}
          </p>
          <ol className="academy-step-list" aria-label="Onboarding steps">
            {onboardingSteps.map((step, index) => (
              <li className={step.id === activeStep ? 'active' : ''} aria-current={step.id === activeStep ? 'step' : undefined} key={step.id}>
                <span>{index + 1}</span>
                <strong>{step.label}</strong>
              </li>
            ))}
          </ol>
        </div>

        <div className="academy-step-content">
          {activeStep === 'welcome' ? (
            <section className="academy-step-panel" aria-labelledby="student-onboarding-title">
              <div className="academy-avatar-preview academy-avatar-preview-large" aria-label="Current academy profile">
                <AvatarPreview avatarName={displayName} avatar={selectedPreset.avatar} regionProgress={[]} />
                <div>
                  <span>Class slot ready</span>
                  <strong>{profile.realName}</strong>
                  <small>{profile.classGroup} · {profile.teacherName}</small>
                </div>
              </div>
              <div className="academy-step-note">
                <strong>Your progress starts from real Paper 3 practice.</strong>
                <span>Next you will set the map name students see, then choose the avatar look.</span>
              </div>
            </section>
          ) : null}

          {activeStep === 'name' ? (
            <section className="academy-step-panel" aria-labelledby="student-onboarding-title">
              <label>
                Academy name
                <input value={academyName} onChange={(event) => setAcademyName(event.target.value)} maxLength={40} />
              </label>
              <div className="academy-avatar-preview" aria-label="Named academy profile">
                <AvatarPreview avatarName={displayName} avatar={selectedPreset.avatar} regionProgress={[]} />
                <div>
                  <span>Map name</span>
                  <strong>{displayName}</strong>
                  <small>{selectedPreset.label}</small>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 'avatar' ? (
            <section className="academy-step-panel" aria-labelledby="student-onboarding-title">
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
            </section>
          ) : null}
        </div>

        <div className="academy-step-actions">
          {canGoBack ? <button className="quiet-button" type="button" onClick={goBack}>Back</button> : <span aria-hidden="true" />}
          <button className="primary-button" type="submit">
            {activeStep === 'avatar' ? 'Enter the P3 world map' : activeStep === 'welcome' ? 'Next step' : 'Continue'}
          </button>
        </div>
      </form>
    </main>
  );
}
