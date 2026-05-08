import type { AvatarSettings, RegionProgress } from '../../types';
import { AvatarRenderer } from '../avatar/AvatarRenderer';

interface AvatarPreviewProps {
  avatarName: string;
  avatar: AvatarSettings;
  regionProgress: RegionProgress[];
}

export function AvatarPreview({ avatarName, avatar, regionProgress }: AvatarPreviewProps) {
  return (
    <AvatarRenderer avatarName={avatarName} avatar={avatar} regionProgress={regionProgress} mode="builder" />
  );
}
