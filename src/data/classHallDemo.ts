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
        hair: 'stargazer-sweep',
        outfit: 'academy-uniform',
        cloak: 'apprentice-cloak',
        accessory: 'algebra-pin',
        frame: 'bronze-academy-frame',
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
        hair: 'practical-crop',
        outfit: 'academy-uniform',
        companion: 'orbit-owl',
        aura: 'starfield-spark',
        frame: 'plain-academy-frame',
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
        hair: 'stargazer-sweep',
        outfit: 'academy-uniform',
        cloak: 'apprentice-cloak',
        accessory: 'no-accessory',
        frame: 'bronze-academy-frame',
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
        hair: 'practical-crop',
        outfit: 'academy-uniform',
        cloak: 'no-cloak',
        accessory: 'algebra-pin',
        aura: 'no-aura',
        frame: 'plain-academy-frame',
      },
    },
    achievements: ['Class Hall Welcomer', 'Mark-Scheme Scribe'],
    motto: 'Small attempts still count.',
    favoriteRegion: 'Argand Atrium',
  },
];
