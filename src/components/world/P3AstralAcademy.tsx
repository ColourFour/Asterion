import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { BookOpenCheck, FileText, Target, Trophy } from 'lucide-react';
import type { AvatarSettings, ClassRegionAccess, RegionDefinition, RegionProgress, WorldDefinition } from '../../types';
import { calculateAcademySummary, nextRegionGoal } from '../../lib/academyProgress';
import { buildAstralRegionMapLayout, type AstralMapPriority } from '../../lib/astralRegionLayout';
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
  regionAccess?: ClassRegionAccess[];
  notice?: string;
  onTrain: (region: RegionDefinition) => void;
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

const restorationLedgerOrder = [
  'algebra-forge',
  'logarithm-grove',
  'trig-observatory',
  'calculus-cliffs',
  'integration-gardens',
  'differential-shrine',
  'numerical-mines',
  'vector-workshop',
  'complex-harbor',
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

function restorationLedgerIndex(regionId: string): number {
  const index = restorationLedgerOrder.indexOf(regionId);
  return index === -1 ? restorationLedgerOrder.length : index;
}

interface RegionMapNodeProps {
  canTrain: boolean;
  fallbackArt: string;
  isRecommended: boolean;
  priority: AstralMapPriority;
  regionProgress: RegionProgress;
  regionLearningSummary?: RegionLearningSummary;
  regionAccess?: ClassRegionAccess;
  style: CSSProperties;
  onTrain: (region: RegionDefinition) => void;
}

function classAccessLabel(access?: ClassRegionAccess): string | undefined {
  if (!access) return undefined;
  return access.access === 'open' ? 'Class open' : 'Field Guide only';
}

function RegionMapNode({ canTrain, fallbackArt, isRecommended, priority, regionProgress, regionLearningSummary, regionAccess, style, onTrain }: RegionMapNodeProps) {
  const { region } = regionProgress;
  const goal = nextRegionGoal(regionProgress);
  const tooltipId = `region-tooltip-${region.id}`;
  const learningStatus = learningStateLabel(regionLearningSummary);
  const accessLabel = classAccessLabel(regionAccess);
  const isFieldGuideOnly = regionAccess?.access === 'field_guide_only';
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
    const obstacleRects = Array.from(document.querySelectorAll<HTMLElement>('.world-hud'))
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
      className={`map-region-node region-${region.id} map-priority-${priority} rank-${regionProgress.rank.toLowerCase()} learning-${regionLearningSummary?.visualTreatment ?? 'not_started'}${isRecommended ? ' recommended-region' : ''}${isFieldGuideOnly ? ' field-guide-only-region' : ''}`}
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
        aria-label={`${region.name}: ${accessLabel ? `${accessLabel}, ` : ''}${learningStatus}, ${regionProgress.rank}, ${percent(regionProgress.averageScoreRatio)} average. ${region.description} ${regionLearningSummary?.nextAction.label ?? goal.label}`}
        aria-describedby={tooltipId}
      >
        <RegionIslandArt regionId={region.id} fallbackArt={fallbackArt} />
        <span className="map-region-label">
          <strong>{region.name}</strong>
          {accessLabel ? <small>{accessLabel}</small> : isRecommended ? <small>Daily Quest</small> : null}
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
          <strong className="node-popover-title">{region.name}</strong>
          <span className="node-popover-status">{accessLabel ?? (canTrain ? learningStatus : regionProgress.isActive ? 'No questions loaded yet' : 'Dormant wing')}</span>
          <p className="node-popover-description">{region.description}</p>
          <p className="node-popover-goal">{isFieldGuideOnly ? 'Field Guide is available. Quick Check, Warm-Up, Practice, and Guardian are locked for this class.' : regionLearningSummary?.nextAction.explanation ?? goal.label}</p>
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
  regionAccess,
  notice,
  onTrain,
}: P3AstralAcademyProps) {
  const summary = calculateAcademySummary(progress);
  const recommended = summary.recommendedRegionName
    ? progress.find((item) => item.region.name === summary.recommendedRegionName)
    : undefined;
  const focusRegionId = avatarLocation.region?.id ?? recommended?.region.id;
  const mapLayout = buildAstralRegionMapLayout(progress, focusRegionId);

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
              <path className="journey-path-glow" d="M23 20 C 32 30, 42 40, 50 47 C 61 34, 72 27, 84 22 M12 43 C 27 44, 40 45, 50 47 C 65 46, 78 47, 90 48 M27 80 C 32 73, 37 67, 42 64 C 53 68, 62 71, 72 70" />
              <path className="journey-path-main" d="M23 20 C 32 30, 42 40, 50 47 C 61 34, 72 27, 84 22 M12 43 C 27 44, 40 45, 50 47 C 65 46, 78 47, 90 48 M27 80 C 32 73, 37 67, 42 64 C 53 68, 62 71, 72 70" />
              <path className="journey-path-branch" d="M62 10 C 57 23, 53 36, 50 47" />
              <path className="journey-path-branch" d="M12 43 C 16 58, 21 70, 27 80" />
              <path className="journey-path-branch" d="M50 47 C 47 54, 44 60, 42 64" />
              <path className="journey-path-branch" d="M72 70 C 81 63, 87 56, 90 48" />
              <path className="journey-path-branch journey-path-far" d="M84 22 C 89 31, 91 40, 90 48" />
              <path className="journey-path-sparks" d="M23 20 62 10 84 22 90 48 72 70 42 64 27 80 12 43 50 47Z" />
            </svg>
          </div>

          {progress.map((regionProgress, index) => {
            const { region } = regionProgress;
            const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
            const isRecommended = summary.recommendedRegionName === region.name;
            const layout = mapLayout[region.id] ?? {
              x: 50,
              y: 50,
              xPct: 50,
              yPct: 50,
              priorityOrder: index + 1,
              priority: 'neutral' as const,
              scale: 1,
              zIndex: 3,
              label: { placement: 'lower' as const, xPct: 50, bottomPx: 8, maxWidthPx: 148 },
            };
            const regionLearningSummary = regionLearningSummaries?.[region.id];
            const access = regionAccess?.find((item) => item.regionId === region.id);
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
                regionAccess={access}
                style={{
                  '--node-scale': layout.scale,
                  '--node-z': layout.zIndex,
                  '--region-delay': `${index * 40}ms`,
                  '--float-delay': `${index * -420}ms`,
                  '--x': `${layout.xPct}%`,
                  '--y': `${layout.yPct}%`,
                  '--label-x': `${layout.label.xPct}%`,
                  '--label-bottom': `${layout.label.bottomPx}px`,
                  '--label-max-width': `${layout.label.maxWidthPx}px`,
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

export function AstralRegionLedger({ progress, regionLearningSummaries, regionAccess, onTrain }: Pick<P3AstralAcademyProps, 'progress' | 'regionLearningSummaries' | 'regionAccess' | 'onTrain'>) {
  const ledgerProgress = [...progress].sort((a, b) => (
    restorationLedgerIndex(a.region.id) - restorationLedgerIndex(b.region.id)
    || a.region.name.localeCompare(b.region.name)
  ));

  return (
    <section className="region-ledger-screen">
      <header className="section-page-header">
        <span className="mode-pill">Region evidence</span>
        <h2>P3 Restoration Ledger</h2>
        <p>Detailed region progress stays here so the world map remains playable and uncluttered.</p>
      </header>
      <div className="region-ledger" aria-label="Region evidence ledger">
        {ledgerProgress.map((regionProgress) => {
          const { region } = regionProgress;
          const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
          const goal = nextRegionGoal(regionProgress);
          const learningSummary = regionLearningSummaries?.[region.id];
          const access = regionAccess?.find((item) => item.regionId === region.id);
          const accessLabel = classAccessLabel(access);
          const isFieldGuideOnly = access?.access === 'field_guide_only';
          const theme = getRegionTheme(region);
          return (
            <article
              aria-disabled={!canTrain}
              aria-label={`${region.name}: ${accessLabel ? `${accessLabel}, ` : ''}${canTrain ? 'open region hub' : regionProgress.isActive ? 'no questions loaded yet' : 'coming soon'}`}
              className={`region-card ${canTrain ? 'is-clickable' : 'is-disabled'} ${getRegionThemeClass(theme)} region-${region.id} rank-${regionProgress.rank.toLowerCase()} learning-${learningSummary?.visualTreatment ?? 'not_started'}${isFieldGuideOnly ? ' field-guide-only-region' : ''}`}
              key={region.id}
              onClick={(event) => {
                if (!canTrain) return;
                if (event.target instanceof Element && event.target.closest('button')) return;
                onTrain(region);
              }}
              onKeyDown={(event) => {
                if (!canTrain) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onTrain(region);
              }}
              role="link"
              tabIndex={canTrain ? 0 : -1}
            >
              <div className="region-card-header">
                <div>
                  <span className="region-state">{accessLabel ?? (canTrain ? learningStateLabel(learningSummary) : regionProgress.isActive ? 'No questions loaded yet' : 'Dormant wing')}</span>
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
                <span>{isFieldGuideOnly ? 'Field Guide is available. Practice and Guardian are locked for this class.' : learningSummary?.nextAction.explanation ?? goal.label}</span>
              </div>
              <button type="button" disabled={!canTrain} onClick={() => onTrain(region)}>
                {canTrain ? (learningSummary?.nextAction.kind === 'field_guide' ? 'Start region' : 'Open region hub') : regionProgress.isActive ? 'No questions loaded yet' : 'Coming soon'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
