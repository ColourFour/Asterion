import type { ClassHallAvatarSnapshot } from '../lib/classHall';

export const CLASS_HALL_DEMO_AVATARS: ClassHallAvatarSnapshot[] = [
  {
    id: 'demo-lyra',
    nickname: 'Lyra',
    house: { name: 'Star House', crest: 'star' },
    avatar: {
      palette: 'violet',
      crest: 'star',
      equipped: {
        hair: 'shoulder-length-straight',
        face: 'determined',
        outfit: 'school-spirit-tracksuit',
      },
    },
    titles: ['Field Guide Cartographer'],
    badges: ['Algebra Pin Bearer'],
    motto: 'One clear line at a time.',
    favoriteRegion: 'Algebra Vault',
  },
  {
    id: 'demo-orin',
    nickname: 'Orin',
    house: { name: 'Compass House', crest: 'compass' },
    avatar: {
      palette: 'aqua',
      crest: 'compass',
      equipped: {
        base: 'student-body-b',
        hair: 'short-crop',
        face: 'focused-soft',
        outfit: 'school-spirit-tracksuit',
      },
    },
    achievements: ['Archive Helper', 'Warm-Up Streak'],
    motto: 'Check the route, then move.',
    favoriteRegion: 'Integral Terraces',
  },
  {
    id: 'demo-sena',
    nickname: 'Sena',
    house: { name: 'Bolt House', crest: 'bolt' },
    avatar: {
      palette: 'ember',
      crest: 'bolt',
      equipped: {
        hair: 'low-ponytail',
        face: 'determined',
        outfit: 'school-spirit-tracksuit',
      },
    },
    titles: ['Guardian Greeter'],
    badges: ['Trigonometry Lantern'],
    motto: 'Sketch first, simplify second.',
    favoriteRegion: 'Trigonometry Spire',
  },
  {
    id: 'demo-mae',
    nickname: 'Mae',
    house: { name: 'Orb House', crest: 'orb' },
    avatar: {
      palette: 'leaf',
      crest: 'orb',
      equipped: {
        hair: 'bob-with-bangs',
        face: 'calm-neutral',
        outfit: 'school-spirit-tracksuit',
        cloak: 'no-cloak',
        aura: 'no-aura',
      },
    },
    achievements: ['Class Hall Welcomer', 'Mark-Scheme Scribe'],
    motto: 'Small attempts still count.',
    favoriteRegion: 'Argand Atrium',
  },
];
