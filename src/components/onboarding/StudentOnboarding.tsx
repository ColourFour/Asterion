import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AVATAR_CATALOG, AVATAR_SLOT_LABELS, type AvatarItem } from '../../data/avatarCatalog';
import { DEFAULT_AVATAR_SETTINGS, DEFAULT_EQUIPPED_AVATAR_ITEMS, normalizeAvatarSettings } from '../../lib/avatarStore';
import type { AvatarSettings, AvatarSlot, StudentProfile } from '../../types';
import { AvatarPreview } from '../profile/AvatarPreview';
import { AsterionMark } from '../shared/AsterionMark';
import { TwinklingStarfield } from '../shared/TwinklingStarfield';

interface StudentOnboardingProps {
  profile: StudentProfile;
  onComplete: (input: { avatarName: string; avatarId: string; avatar: AvatarSettings }) => void;
}

type OnboardingStep = 'welcome' | 'identity' | 'avatar' | 'ready';

const onboardingSteps: { id: OnboardingStep; label: string }[] = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'identity', label: 'Identity' },
  { id: 'avatar', label: 'Avatar' },
  { id: 'ready', label: 'Ready' },
];

const starterAvatarSlots: AvatarSlot[] = ['base', 'hair', 'face', 'outfit'];
const paletteOptions: Array<{ id: AvatarSettings['palette']; label: string }> = [
  { id: 'ember', label: 'Ember' },
  { id: 'aqua', label: 'Aqua' },
  { id: 'violet', label: 'Violet' },
  { id: 'leaf', label: 'Leaf' },
];
const crestOptions: Array<{ id: AvatarSettings['crest']; label: string }> = [
  { id: 'star', label: 'Star' },
  { id: 'bolt', label: 'Bolt' },
  { id: 'compass', label: 'Compass' },
  { id: 'orb', label: 'Orb' },
];

function starterItemsForSlot(slot: AvatarSlot): AvatarItem[] {
  const starterItems = AVATAR_CATALOG.filter((item) => (
    item.slot === slot
    && item.unlockCondition.type === 'starter'
    && !item.isEmpty
  ));
  return starterItems.length ? starterItems : AVATAR_CATALOG.filter((item) => item.id === DEFAULT_EQUIPPED_AVATAR_ITEMS[slot]);
}

export function StudentOnboarding({ profile, onComplete }: StudentOnboardingProps) {
  const academyNameHelperId = 'academy-name-helper';
  const [activeStep, setActiveStep] = useState<OnboardingStep>('welcome');
  const [academyName, setAcademyName] = useState(profile.avatarName);
  const [avatar, setAvatar] = useState<AvatarSettings>(() => normalizeAvatarSettings(DEFAULT_AVATAR_SETTINGS));
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const displayName = academyName.trim() || profile.avatarName.trim() || profile.realName.trim() || 'Asterion Student';
  const activeStepIndex = onboardingSteps.findIndex((step) => step.id === activeStep);
  const canGoBack = activeStepIndex > 0;
  const selectedEquipped = normalizeAvatarSettings(avatar).equipped ?? DEFAULT_EQUIPPED_AVATAR_ITEMS;
  const selectedBody = AVATAR_CATALOG.find((item) => item.id === selectedEquipped.base)?.displayName ?? 'Starter body';
  const selectedHair = AVATAR_CATALOG.find((item) => item.id === selectedEquipped.hair)?.displayName ?? 'Starter hair';
  const selectedFace = AVATAR_CATALOG.find((item) => item.id === selectedEquipped.face)?.displayName ?? 'Starter face';
  const selectedOutfit = AVATAR_CATALOG.find((item) => item.id === selectedEquipped.outfit)?.displayName ?? 'Starter outfit';

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
    if (activeStep !== 'ready') {
      goNext();
      return;
    }
    onComplete({ avatarName: displayName, avatarId: 'custom-starter', avatar });
  }

  function updateEquipped(slot: AvatarSlot, itemId: string) {
    setAvatar((current) => normalizeAvatarSettings({
      ...current,
      equipped: {
        ...(current.equipped ?? DEFAULT_EQUIPPED_AVATAR_ITEMS),
        [slot]: itemId,
      },
    }));
  }

  function updatePalette(palette: AvatarSettings['palette']) {
    setAvatar((current) => normalizeAvatarSettings({ ...current, palette }));
  }

  function updateCrest(crest: AvatarSettings['crest']) {
    setAvatar((current) => normalizeAvatarSettings({ ...current, crest }));
  }

  return (
    <main className="app-shell onboarding-shell student-onboarding-shell">
      <TwinklingStarfield />
      <form className="profile-form academy-avatar-form academy-onboarding-stepper" onSubmit={handleSubmit} aria-label="Create academy avatar">
        <div className="academy-stepper-header">
          <div className="academy-stepper-title-row">
            <div>
              <span className="mode-pill">First day at Asterion Academy</span>
              <h1 id="student-onboarding-title" ref={stepHeadingRef} tabIndex={-1}>
                {activeStep === 'welcome'
                  ? 'Welcome to Asterion'
                  : activeStep === 'identity'
                    ? 'Confirm your academy identity'
                    : activeStep === 'avatar'
                      ? 'Choose a starter avatar'
                      : 'Ready to enter the academy'}
              </h1>
              <p>
                {activeStep === 'welcome'
                  ? 'This short setup keeps your class slot, map name, and avatar clear before Paper 3 practice starts.'
                  : activeStep === 'identity'
                    ? 'Check your class details and choose the name shown on your map and avatar card.'
                    : activeStep === 'avatar'
                      ? 'Choose one starter look. The avatar system can use placeholder layers now and production PNGs later.'
                      : 'Review your setup, then enter the P3 Astral Academy world map.'}
              </p>
            </div>
            <AsterionMark />
          </div>
          <ol className="academy-step-list" aria-label="Onboarding steps">
            {onboardingSteps.map((step, index) => (
              <li className={step.id === activeStep ? 'active' : ''} aria-current={step.id === activeStep ? 'step' : undefined} key={step.id}>
                <button
                  type="button"
                  aria-label={`Go to ${step.label} step`}
                  onClick={() => goToStep(step.id)}
                >
                  <span>{index + 1}</span>
                  <strong>{step.label}</strong>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="academy-step-content">
          {activeStep === 'welcome' ? (
            <section className="academy-step-panel" aria-labelledby="student-onboarding-title">
              <div className="academy-welcome-grid">
                <div>
                  <span className="academy-panel-kicker">Class slot ready</span>
                  <strong>{profile.realName}</strong>
                  <small>{profile.classGroup} · {profile.teacherName}</small>
                </div>
                <div>
                  <span className="academy-panel-kicker">Practice source</span>
                  <strong>Paper 3 image questions</strong>
                  <small>Question and mark-scheme images remain the source of truth.</small>
                </div>
              </div>
              <div className="academy-step-note">
                <strong>Your progress starts from real Paper 3 practice.</strong>
                <span>Next you will confirm your identity, choose an avatar, and enter the map.</span>
              </div>
            </section>
          ) : null}

          {activeStep === 'identity' ? (
            <section className="academy-step-panel" aria-labelledby="student-onboarding-title">
              <div className="academy-identity-summary" aria-label="Student class identity">
                <div>
                  <span>Roster name</span>
                  <strong>{profile.realName}</strong>
                </div>
                <div>
                  <span>Class</span>
                  <strong>{profile.classGroup}</strong>
                </div>
                <div>
                  <span>Teacher</span>
                  <strong>{profile.teacherName}</strong>
                </div>
              </div>
              <label>
                Academy name
                <input
                  aria-describedby={academyNameHelperId}
                  value={academyName}
                  onChange={(event) => setAcademyName(event.target.value)}
                  maxLength={40}
                />
              </label>
              <p className="academy-field-helper" id={academyNameHelperId}>This is the name shown on your map and avatar card.</p>
              <div className="academy-avatar-preview" aria-label="Named academy profile">
                <AvatarPreview avatarName={displayName} avatar={avatar} regionProgress={[]} />
                <div>
                  <span>Map name</span>
                  <strong>{displayName}</strong>
                  <small>{selectedBody} · {selectedHair}</small>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 'avatar' ? (
            <section className="academy-step-panel" aria-labelledby="student-onboarding-title">
              <div className="academy-avatar-editor">
                <div className="academy-avatar-preview academy-avatar-preview-large" aria-label="Selected academy profile">
                  <AvatarPreview avatarName={displayName} avatar={avatar} regionProgress={[]} />
                  <div>
                    <span>Current avatar</span>
                    <strong>{displayName}</strong>
                    <small>{selectedBody} · {selectedHair} · {selectedFace}</small>
                  </div>
                </div>

                <div>
                  <div className="academy-avatar-control-grid">
                    {starterAvatarSlots.map((slot) => (
                      <label key={slot}>
                        {slot === 'base' ? 'Body type' : AVATAR_SLOT_LABELS[slot]}
                        <select value={selectedEquipped[slot]} onChange={(event) => updateEquipped(slot, event.target.value)}>
                          {starterItemsForSlot(slot).map((item) => (
                            <option key={item.id} value={item.id}>{item.displayName}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                    <label>
                      House color
                      <select value={avatar.palette} onChange={(event) => updatePalette(event.target.value as AvatarSettings['palette'])}>
                        {paletteOptions.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Crest
                      <select value={avatar.crest} onChange={(event) => updateCrest(event.target.value as AvatarSettings['crest'])}>
                        {crestOptions.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <p className="academy-field-helper">Starter choices use safe placeholder layers when PNG assets are missing.</p>
                </div>
              </div>
            </section>
          ) : null}

          {activeStep === 'ready' ? (
            <section className="academy-step-panel academy-ready-panel" aria-labelledby="student-onboarding-title">
              <div className="academy-avatar-preview academy-avatar-preview-large" aria-label="Ready academy profile">
                <AvatarPreview avatarName={displayName} avatar={avatar} regionProgress={[]} />
                <div>
                  <span>Ready for the map</span>
                  <strong>{displayName}</strong>
                  <small>{selectedHair} · {selectedOutfit} · {profile.classGroup}</small>
                </div>
              </div>
              <div className="academy-ready-checklist" aria-label="Ready checklist">
                <span>Class slot confirmed</span>
                <span>Academy name set</span>
                <span>Starter avatar selected</span>
              </div>
            </section>
          ) : null}
        </div>

        <div className="academy-step-actions">
          {canGoBack ? <button className="quiet-button" type="button" onClick={goBack}>Back</button> : <span aria-hidden="true" />}
          <button className="primary-button" type="submit">
            {activeStep === 'ready' ? 'Enter the P3 world map' : activeStep === 'welcome' ? 'Next step' : 'Continue'}
          </button>
        </div>
      </form>
    </main>
  );
}
