import type { AvatarSettings, StudentProfile } from '../types';
import { DEFAULT_EQUIPPED_AVATAR_ITEMS, normalizeAvatarSettings } from './avatarStore';

export interface AcademyAvatarPreset {
  id: string;
  label: string;
  description: string;
  avatar: AvatarSettings;
}

export const ACADEMY_AVATAR_PRESETS: AcademyAvatarPreset[] = [
  {
    id: 'star-apprentice',
    label: 'Star Apprentice',
    description: 'Calm, focused, ready for the first Field Guide.',
    avatar: normalizeAvatarSettings({
      palette: 'ember',
      crest: 'star',
      equipped: DEFAULT_EQUIPPED_AVATAR_ITEMS,
    }),
  },
  {
    id: 'aqua-analyst',
    label: 'Aqua Analyst',
    description: 'Clear working, steady checks, tidy methods.',
    avatar: normalizeAvatarSettings({
      palette: 'aqua',
      crest: 'compass',
      equipped: DEFAULT_EQUIPPED_AVATAR_ITEMS,
    }),
  },
  {
    id: 'violet-solver',
    label: 'Violet Solver',
    description: 'Persistent problem-solver for longer P3 questions.',
    avatar: normalizeAvatarSettings({
      palette: 'violet',
      crest: 'orb',
      equipped: DEFAULT_EQUIPPED_AVATAR_ITEMS,
    }),
  },
  {
    id: 'leaf-strategist',
    label: 'Leaf Strategist',
    description: 'Methodical planner for warm-ups and exam training.',
    avatar: normalizeAvatarSettings({
      palette: 'leaf',
      crest: 'bolt',
      equipped: DEFAULT_EQUIPPED_AVATAR_ITEMS,
    }),
  },
];

export function getAcademyAvatarPreset(id: string): AcademyAvatarPreset {
  return ACADEMY_AVATAR_PRESETS.find((preset) => preset.id === id) ?? ACADEMY_AVATAR_PRESETS[0];
}

export function completeStudentOnboarding(
  profile: StudentProfile,
  input: {
    avatarName: string;
    avatarId: string;
    completedAt?: string;
  },
): Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'> {
  const completedAt = input.completedAt ?? new Date().toISOString();
  return {
    realName: profile.realName,
    classGroup: profile.classGroup,
    teacherName: profile.teacherName,
    avatarName: input.avatarName.trim(),
    avatarId: input.avatarId,
    onboardingCompleted: true,
    onboardingCompletedAt: completedAt,
    classClaim: profile.classClaim,
  };
}
