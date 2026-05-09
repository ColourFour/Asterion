import { BookOpenCheck } from 'lucide-react';
import type { RegionTheme } from '../../../lib/regionThemes';

interface RegionGuideCalloutProps {
  theme: RegionTheme;
}

export function RegionGuideCallout({ theme }: RegionGuideCalloutProps) {
  return (
    <aside className="region-guide-callout">
      <BookOpenCheck size={18} />
      <div>
        <span>Guide focus</span>
        <p>{theme.guideMessage}</p>
      </div>
    </aside>
  );
}
