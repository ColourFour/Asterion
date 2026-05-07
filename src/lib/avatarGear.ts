import type { AvatarGear, RegionProgress } from '../types';

const rankValue = {
  Dormant: 0,
  Discovered: 1,
  Bronze: 2,
  Silver: 3,
  Gold: 4,
  Mastered: 5,
};

function atLeast(progress: RegionProgress | undefined, rank: keyof typeof rankValue): boolean {
  return Boolean(progress && rankValue[progress.rank] >= rankValue[rank]);
}

export function deriveAvatarGear(regions: RegionProgress[]): AvatarGear {
  const byId = new Map(regions.map((progress) => [progress.region.id, progress]));
  const gear: string[] = [];

  if (regions.some((progress) => atLeast(progress, 'Bronze'))) gear.push('Apprentice Cloak');
  if (atLeast(byId.get('algebra-forge'), 'Silver')) gear.push('Archive Gauntlets');
  if (atLeast(byId.get('trig-observatory'), 'Silver')) gear.push('Star Lens');
  if (atLeast(byId.get('complex-harbor'), 'Silver')) gear.push('Argand Compass');
  if (regions.some((progress) => atLeast(progress, 'Gold'))) gear.push('Astral Trim');
  if (regions.filter((progress) => atLeast(progress, 'Gold')).length >= 3) gear.push('Academy Champion Badge');

  const title = gear.includes('Academy Champion Badge')
    ? 'Academy Champion'
    : gear.includes('Astral Trim')
      ? 'Astral Scholar'
      : gear.some((item) => item !== 'Apprentice Cloak')
        ? 'Region Specialist'
        : gear.includes('Apprentice Cloak')
          ? 'Apprentice Restorer'
          : 'New Arrival';

  return { title, gear };
}
