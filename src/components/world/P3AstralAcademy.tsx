import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { BookOpenCheck, FileText, Map as MapIcon, ScrollText, Target, Trophy, UsersRound } from 'lucide-react';
import type { AvatarSettings, RegionDefinition, RegionProgress, WorldDefinition } from '../../types';
import { calculateAcademySummary, nextRegionGoal } from '../../lib/academyProgress';
import { astralAssets, getAstralRegionAsset, getAstralRegionAssetDimensions } from '../../lib/astralAssets';
import type { AvatarLocation } from '../../lib/avatarLocation';
import type { RegionLearningSummary } from '../../lib/regionLearning';
import { getRegionTheme, getRegionThemeClass } from '../../lib/regionThemes';
import { WorldMapAvatarMarker } from '../avatar/WorldMapAvatarMarker';

interface P3AstralAcademyProps {
  world: WorldDefinition;
  progress: RegionProgress[];
  avatarName: string;
  avatar: AvatarSettings;
  avatarLocation: AvatarLocation;
  regionLearningSummaries?: Record<string, RegionLearningSummary>;
  notice?: string;
  onTrain: (region: RegionDefinition) => void;
  onRegions: () => void;
  onProfile: () => void;
  onClassHall: () => void;
  onTeacher: () => void;
}

function percent(value: number | undefined): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : 'n/a';
}

function rankSymbol(rank: string): string {
  return {
    Dormant: '○',
    Discovered: '◇',
    Bronze: '✓',
    Silver: '✦',
    Gold: '★',
    Mastered: '✹',
  }[rank] ?? '○';
}

function regionGlyph(regionId: string): string {
  return {
    'algebra-forge': 'ALG',
    'logarithm-grove': 'LOG',
    'trig-observatory': 'TRI',
    'complex-harbor': 'ARG',
    'calculus-cliffs': 'D/DX',
    'integration-gardens': 'INT',
    'vector-workshop': 'VEC',
    'numerical-mines': 'ITER',
    'differential-shrine': 'ODE',
  }[regionId] ?? 'P3';
}

function learningStateLabel(summary?: RegionLearningSummary): string {
  const labels: Record<string, string> = {
    locked: 'Locked',
    available: 'Field Guide ready',
    field_guide_started: 'Field Guide started',
    field_guide_completed: 'Field Guide complete',
    training_in_progress: 'Training in progress',
    guardian_unlocked: 'Guardian unlocked',
    guardian_attempted: 'Guardian attempted',
    guardian_cleared: 'Guardian cleared',
    mastered: 'Mastered',
    needs_review: 'Needs review',
  };
  return labels[summary?.state ?? ''] ?? 'Region ready';
}

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipPosition {
  left: number;
  top: number;
  placement: TooltipPlacement;
}

type MapPriority = 'daily' | 'relevant' | 'neutral' | 'quiet';

interface MapSlot {
  x: number;
  y: number;
}

interface RegionMapLayout extends MapSlot {
  priority: MapPriority;
  scale: number;
  zIndex: number;
}

const regionArt: Record<string, string> = {
  'algebra-forge': 'archive',
  'logarithm-grove': 'dome',
  'trig-observatory': 'spire',
  'complex-harbor': 'atrium',
  'calculus-cliffs': 'cliffs',
  'integration-gardens': 'crystal',
  'vector-workshop': 'gate',
  'numerical-mines': 'forge',
  'differential-shrine': 'shrine',
};

const regionJourneyOrder = [
  'algebra-forge',
  'logarithm-grove',
  'trig-observatory',
  'complex-harbor',
  'calculus-cliffs',
  'integration-gardens',
  'vector-workshop',
  'numerical-mines',
  'differential-shrine',
];

const relatedRegionIds: Record<string, string[]> = {
  'algebra-forge': ['logarithm-grove', 'trig-observatory', 'numerical-mines'],
  'logarithm-grove': ['algebra-forge', 'trig-observatory', 'numerical-mines'],
  'trig-observatory': ['logarithm-grove', 'complex-harbor', 'vector-workshop'],
  'complex-harbor': ['trig-observatory', 'vector-workshop', 'calculus-cliffs'],
  'calculus-cliffs': ['integration-gardens', 'differential-shrine', 'numerical-mines'],
  'integration-gardens': ['calculus-cliffs', 'differential-shrine', 'algebra-forge'],
  'vector-workshop': ['complex-harbor', 'trig-observatory', 'calculus-cliffs'],
  'numerical-mines': ['calculus-cliffs', 'algebra-forge', 'differential-shrine'],
  'differential-shrine': ['integration-gardens', 'calculus-cliffs', 'numerical-mines'],
};

const focusSlot: MapSlot = { x: 58, y: 43 };
const relatedSlots: MapSlot[] = [
  { x: 31, y: 24 },
  { x: 78, y: 25 },
  { x: 73, y: 67 },
];
const supportSlots: MapSlot[] = [
  { x: 10, y: 54 },
  { x: 29, y: 70 },
  { x: 89, y: 53 },
];
const distantSlots: MapSlot[] = [
  { x: 50, y: 17 },
  { x: 49, y: 80 },
  { x: 23, y: 32 },
];

function RegionIslandArt({ fallbackArt, regionId }: { fallbackArt: string; regionId: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const assetPath = getAstralRegionAsset(regionId);
  const assetDimensions = getAstralRegionAssetDimensions(regionId);
  const showProductionArt = Boolean(assetPath && !imageFailed);

  return (
    <span className={`island-art island-${fallbackArt}${showProductionArt ? ' has-production-art' : ' uses-fallback-art'}`} aria-hidden="true">
      {showProductionArt ? (
        <img
          className="region-island-image"
          src={assetPath ?? ''}
          alt=""
          width={assetDimensions?.width}
          height={assetDimensions?.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <span className="island-base" />
          <span className="island-building" />
        </>
      )}
    </span>
  );
}

function overlapArea(a: DOMRect | { left: number; top: number; right: number; bottom: number }, b: DOMRect): number {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

function candidateRect(triggerRect: DOMRect, tooltipWidth: number, tooltipHeight: number, placement: TooltipPlacement) {
  const gap = 14;
  const centerX = triggerRect.left + triggerRect.width / 2;
  const centerY = triggerRect.top + triggerRect.height / 2;

  if (placement === 'top') {
    return { left: centerX - tooltipWidth / 2, top: triggerRect.top - tooltipHeight - gap };
  }
  if (placement === 'bottom') {
    return { left: centerX - tooltipWidth / 2, top: triggerRect.bottom + gap };
  }
  if (placement === 'left') {
    return { left: triggerRect.left - tooltipWidth - gap, top: centerY - tooltipHeight / 2 };
  }
  return { left: triggerRect.right + gap, top: centerY - tooltipHeight / 2 };
}

function positionTooltip(triggerRect: DOMRect, tooltipRect: DOMRect, obstacleRects: DOMRect[] = []): TooltipPosition {
  const padding = 12;
  const tooltipWidth = tooltipRect.width;
  const tooltipHeight = tooltipRect.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const placements: TooltipPlacement[] = ['top', 'bottom', 'right', 'left'];

  const candidates = placements.map((placement) => {
    const raw = candidateRect(triggerRect, tooltipWidth, tooltipHeight, placement);
    const clamped = {
      left: clamp(raw.left, padding, viewportWidth - tooltipWidth - padding),
      top: clamp(raw.top, padding, viewportHeight - tooltipHeight - padding),
    };
    const rect = {
      left: clamped.left,
      top: clamped.top,
      right: clamped.left + tooltipWidth,
      bottom: clamped.top + tooltipHeight,
    };
    const overflow =
      Math.max(0, padding - raw.left)
      + Math.max(0, raw.left + tooltipWidth + padding - viewportWidth)
      + Math.max(0, padding - raw.top)
      + Math.max(0, raw.top + tooltipHeight + padding - viewportHeight);
    const obstaclePenalty = obstacleRects.reduce((sum, obstacleRect) => sum + overlapArea(rect, obstacleRect), 0);
    return {
      placement,
      left: clamped.left,
      top: clamped.top,
      score: overflow * 1000 + obstaclePenalty,
    };
  });

  return candidates.sort((a, b) => a.score - b.score)[0];
}

function journeyIndex(regionId: string): number {
  const index = regionJourneyOrder.indexOf(regionId);
  return index === -1 ? regionJourneyOrder.length : index;
}

function isQuietRegion(regionProgress: RegionProgress): boolean {
  return (
    !regionProgress.isActive
    || regionProgress.availableQuestions === 0
    || regionProgress.rank === 'Gold'
    || regionProgress.rank === 'Mastered'
  );
}

function scaleForPriority(priority: MapPriority): number {
  return {
    daily: 1.22,
    relevant: 1.02,
    neutral: 0.96,
    quiet: 0.88,
  }[priority];
}

function buildRegionMapLayout(progress: RegionProgress[], recommendedRegionId?: string): Record<string, RegionMapLayout> {
  const layout: Record<string, RegionMapLayout> = {};
  const byId = new Map(progress.map((regionProgress) => [regionProgress.region.id, regionProgress]));
  const assignedIds = new Set<string>();

  function assign(regionProgress: RegionProgress, slot: MapSlot, priority: MapPriority, zIndex: number) {
    layout[regionProgress.region.id] = {
      ...slot,
      priority,
      scale: scaleForPriority(priority),
      zIndex,
    };
    assignedIds.add(regionProgress.region.id);
  }

  const recommendedProgress = recommendedRegionId ? byId.get(recommendedRegionId) : undefined;
  if (recommendedProgress) {
    assign(recommendedProgress, focusSlot, 'daily', 7);
  }

  const relatedIds = recommendedRegionId ? relatedRegionIds[recommendedRegionId] ?? [] : [];
  relatedIds
    .map((regionId) => byId.get(regionId))
    .filter((item): item is RegionProgress => {
      if (!item) return false;
      return !assignedIds.has(item.region.id);
    })
    .slice(0, relatedSlots.length)
    .forEach((regionProgress, index) => assign(regionProgress, relatedSlots[index], isQuietRegion(regionProgress) ? 'quiet' : 'relevant', 5));

  const remaining = progress
    .filter((regionProgress) => !assignedIds.has(regionProgress.region.id))
    .sort((a, b) => {
      const quietDifference = Number(isQuietRegion(a)) - Number(isQuietRegion(b));
      if (quietDifference !== 0) return quietDifference;
      return journeyIndex(a.region.id) - journeyIndex(b.region.id);
    });

  const remainingSlots = [...supportSlots, ...distantSlots];
  remaining.forEach((regionProgress, index) => {
    const fallbackSlot: MapSlot = {
      x: 20 + ((index * 13) % 62),
      y: 24 + ((index * 17) % 52),
    };
    const priority: MapPriority = isQuietRegion(regionProgress)
      ? 'quiet'
      : index < supportSlots.length
        ? 'neutral'
        : 'quiet';
    assign(regionProgress, remainingSlots[index] ?? fallbackSlot, priority, priority === 'quiet' ? 2 : 3);
  });

  return layout;
}

interface RegionMapNodeProps {
  canTrain: boolean;
  fallbackArt: string;
  isRecommended: boolean;
  priority: MapPriority;
  regionProgress: RegionProgress;
  regionLearningSummary?: RegionLearningSummary;
  style: CSSProperties;
  onTrain: (region: RegionDefinition) => void;
}

function RegionMapNode({ canTrain, fallbackArt, isRecommended, priority, regionProgress, regionLearningSummary, style, onTrain }: RegionMapNodeProps) {
  const { region } = regionProgress;
  const goal = nextRegionGoal(regionProgress);
  const tooltipId = `region-tooltip-${region.id}`;
  const learningStatus = learningStateLabel(regionLearningSummary);
  const nodeRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ left: 0, top: 0, placement: 'bottom' });

  const updateTooltipPosition = useCallback(() => {
    const node = nodeRef.current;
    const tooltip = tooltipRef.current;
    if (!node || !tooltip) return;

    const triggerRect = node.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const obstacleRects = Array.from(document.querySelectorAll<HTMLElement>('.bottom-menu, .world-hud'))
      .filter((element) => element.offsetParent !== null)
      .map((element) => element.getBoundingClientRect());
    setTooltipPosition(positionTooltip(triggerRect, tooltipRect, obstacleRects));
  }, []);

  useEffect(() => {
    if (!isTooltipOpen) return undefined;

    const reposition = () => updateTooltipPosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isTooltipOpen, updateTooltipPosition]);

  function showTooltip() {
    setIsTooltipOpen(true);
    updateTooltipPosition();
    window.requestAnimationFrame(updateTooltipPosition);
  }

  function hideTooltip() {
    setIsTooltipOpen(false);
  }

  return (
    <article
      className={`map-region-node region-${region.id} map-priority-${priority} rank-${regionProgress.rank.toLowerCase()} learning-${regionLearningSummary?.visualTreatment ?? 'not_started'}${isRecommended ? ' recommended-region' : ''}`}
      key={region.id}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hideTooltip();
      }}
      onFocus={showTooltip}
      onPointerEnter={showTooltip}
      onPointerLeave={hideTooltip}
      ref={nodeRef}
      style={style}
    >
      <button
        type="button"
        disabled={!canTrain}
        onClick={() => onTrain(region)}
        aria-label={`${region.name}: ${learningStatus}, ${regionProgress.rank}, ${percent(regionProgress.averageScoreRatio)} average. ${region.description} ${regionLearningSummary?.nextAction.label ?? goal.label}`}
        aria-describedby={tooltipId}
      >
        <RegionIslandArt regionId={region.id} fallbackArt={fallbackArt} />
        <span className="map-region-label">
          <strong>{region.name}</strong>
          {isRecommended ? <small>Daily Quest</small> : null}
        </span>
        <span className="region-orbit" aria-hidden="true">{rankSymbol(regionProgress.rank)}</span>
      </button>
      {createPortal(
        <div
          className={`node-popover tooltip-${tooltipPosition.placement}${isTooltipOpen ? ' is-visible' : ''}`}
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          style={{
            '--tooltip-left': `${tooltipPosition.left}px`,
            '--tooltip-top': `${tooltipPosition.top}px`,
          } as CSSProperties}
        >
          <div className="region-glyph" aria-hidden="true">{regionGlyph(region.id)}</div>
          <strong className="node-popover-title">{region.name}</strong>
          <span className="node-popover-status">{canTrain ? learningStatus : regionProgress.isActive ? 'No questions loaded yet' : 'Dormant wing'}</span>
          <p className="node-popover-description">{region.description}</p>
          <p className="node-popover-goal">{regionLearningSummary?.nextAction.explanation ?? goal.label}</p>
        </div>,
        document.body,
      )}
    </article>
  );
}

export function P3AstralAcademy({
  world,
  progress,
  avatarName,
  avatar,
  avatarLocation,
  regionLearningSummaries,
  notice,
  onTrain,
  onRegions,
  onProfile,
  onClassHall,
  onTeacher,
}: P3AstralAcademyProps) {
  const summary = calculateAcademySummary(progress);
  const recommended = summary.recommendedRegionName
    ? progress.find((item) => item.region.name === summary.recommendedRegionName)
    : undefined;
  const focusRegionId = avatarLocation.region?.id ?? recommended?.region.id;
  const mapLayout = buildRegionMapLayout(progress, focusRegionId);

  return (
    <section className="world-screen">
      <div className="map-shell">
        <div className="starfield" aria-hidden="true" style={{ '--astral-starfield': `url("${astralAssets.starfieldMap}")` } as CSSProperties}>
          <span className="constellation constellation-a" />
          <span className="constellation constellation-b" />
          <span className="galaxy galaxy-a" />
          <span className="galaxy galaxy-b" />
        </div>

        <div className="academy-map" aria-label={`${world.name} regions`}>
          <div className="map-paths" aria-hidden="true">
            <svg className="journey-path" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path className="journey-path-glow" d="M10 54 C 20 38, 30 70, 42 52 S 47 31, 58 43 S 72 62, 89 53" />
              <path className="journey-path-main" d="M10 54 C 19 41, 30 65, 41 53 S 48 30, 58 43 S 72 60, 89 53" />
              <path className="journey-path-branch" d="M31 24 C 39 19, 44 16, 50 17 S 58 27, 58 43" />
              <path className="journey-path-branch" d="M58 43 C 61 30, 68 24, 78 25" />
              <path className="journey-path-branch" d="M58 43 C 61 56, 66 64, 73 67" />
              <path className="journey-path-branch journey-path-far" d="M29 70 C 37 82, 43 85, 49 80 S 55 61, 58 43" />
              <path className="journey-path-sparks" d="M13 54 31 24 50 17 78 25 89 53 73 67 49 80 29 70Z" />
            </svg>
          </div>

          {progress.map((regionProgress, index) => {
            const { region } = regionProgress;
            const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
            const isRecommended = summary.recommendedRegionName === region.name;
            const layout = mapLayout[region.id] ?? { x: 50, y: 50, priority: 'neutral', scale: 1, zIndex: 3 };
            const regionLearningSummary = regionLearningSummaries?.[region.id];
            return (
              <RegionMapNode
                canTrain={canTrain}
                fallbackArt={regionArt[region.id] ?? 'archive'}
                isRecommended={isRecommended}
                key={region.id}
                onTrain={onTrain}
                priority={layout.priority}
                regionProgress={regionProgress}
                regionLearningSummary={regionLearningSummary}
                style={{
                  '--node-scale': layout.scale,
                  '--node-z': layout.zIndex,
                  '--region-delay': `${index * 40}ms`,
                  '--float-delay': `${index * -420}ms`,
                  '--x': `${layout.x}%`,
                  '--y': `${layout.y}%`,
                } as CSSProperties}
              />
            );
          })}
          <WorldMapAvatarMarker
            avatarName={avatarName}
            avatar={avatar}
            regionProgress={progress}
            location={avatarLocation}
            slot={avatarLocation.region ? mapLayout[avatarLocation.region.id] : undefined}
            onContinue={() => {
              if (avatarLocation.region) onTrain(avatarLocation.region);
            }}
          />
        </div>

        <div className="bottom-menu" aria-label="Academy menu">
          <button type="button" onClick={onProfile}><ScrollText size={20} /> Profile</button>
          <button type="button" onClick={onClassHall}><UsersRound size={20} /> Commons</button>
          <button type="button" disabled={!recommended} onClick={() => recommended && onTrain(recommended.region)}><FileText size={20} /> Region</button>
          <button type="button" onClick={onRegions}><MapIcon size={20} /> Regions</button>
          <button type="button" onClick={onTeacher}><BookOpenCheck size={20} /> Archive</button>
        </div>
      </div>

      {notice ? <div className="world-notice">{notice}</div> : null}

      <div className="academy-summary" aria-label="Academy progress summary">
        <div><Trophy size={18} /><span>Academy title</span><strong>{summary.title}</strong></div>
        <div><BookOpenCheck size={18} /><span>Attempts logged</span><strong>{summary.attempts}</strong></div>
        <div><FileText size={18} /><span>Evidence XP</span><strong>{summary.totalXp}</strong></div>
        <div><Target size={18} /><span>Estimated average</span><strong>{percent(summary.averageScoreRatio)}</strong></div>
      </div>
    </section>
  );
}

export function AstralRegionLedger({ progress, regionLearningSummaries, onTrain }: Pick<P3AstralAcademyProps, 'progress' | 'regionLearningSummaries' | 'onTrain'>) {
  return (
    <section className="region-ledger-screen">
      <header className="section-page-header">
        <span className="mode-pill">Region evidence</span>
        <h2>P3 Restoration Ledger</h2>
        <p>Detailed region progress stays here so the world map remains playable and uncluttered.</p>
      </header>
      <div className="region-ledger" aria-label="Region evidence ledger">
        {progress.map((regionProgress) => {
          const { region } = regionProgress;
          const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
          const goal = nextRegionGoal(regionProgress);
          const learningSummary = regionLearningSummaries?.[region.id];
          const theme = getRegionTheme(region);
          return (
            <article className={`region-card ${getRegionThemeClass(theme)} region-${region.id} rank-${regionProgress.rank.toLowerCase()} learning-${learningSummary?.visualTreatment ?? 'not_started'}`} key={region.id}>
              <div className="region-card-header">
                <div>
                  <span className="region-state">{canTrain ? learningStateLabel(learningSummary) : regionProgress.isActive ? 'No questions loaded yet' : 'Dormant wing'}</span>
                  <h3>{region.name}</h3>
                </div>
                <strong>{regionProgress.rank}</strong>
              </div>
              <p>{region.description}</p>
              <div className="region-meter">
                <span style={{ width: `${Math.min(100, Math.round((regionProgress.averageScoreRatio ?? 0) * 100))}%` }} />
              </div>
              <dl className="region-stats">
                <div><dt>Attempts</dt><dd>{regionProgress.attempts}</dd></div>
                <div><dt>Average</dt><dd>{percent(regionProgress.averageScoreRatio)}</dd></div>
                <div><dt>Recent</dt><dd>{percent(regionProgress.recentScoreRatio)}</dd></div>
                <div><dt>Subtopics</dt><dd>{regionProgress.subtopicsTouched}/{region.subtopics.length}</dd></div>
              </dl>
              <div className="subtopic-list">
                {region.subtopics.slice(0, 5).map((subtopic) => <span key={subtopic}>{subtopic}</span>)}
              </div>
              <div className="region-goal">
                <Target size={14} />
                <span>{learningSummary?.nextAction.explanation ?? goal.label}</span>
              </div>
              <button type="button" disabled={!canTrain} onClick={() => onTrain(region)}>
                {canTrain ? 'Open region hub' : regionProgress.isActive ? 'No questions loaded yet' : 'Coming soon'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
