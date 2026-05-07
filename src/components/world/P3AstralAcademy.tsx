import type { CSSProperties } from 'react';
import { BookOpenCheck, ChevronRight, FileText, Target, Trophy } from 'lucide-react';
import type { RegionDefinition, RegionProgress, WorldDefinition } from '../../types';
import { calculateAcademySummary, nextRegionGoal } from '../../lib/academyProgress';

interface P3AstralAcademyProps {
  world: WorldDefinition;
  progress: RegionProgress[];
  notice?: string;
  onTrain: (region: RegionDefinition) => void;
  onReviewWeak: () => void;
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

export function P3AstralAcademy({ world, progress, notice, onTrain, onReviewWeak, onTeacher }: P3AstralAcademyProps) {
  const summary = calculateAcademySummary(progress);
  const recommended = summary.recommendedRegionName
    ? progress.find((item) => item.region.name === summary.recommendedRegionName)
    : undefined;
  const recommendedGoal = recommended ? nextRegionGoal(recommended) : undefined;
  const canStartRecommended = Boolean(recommended?.isActive && recommended.availableQuestions > 0);

  return (
    <section className="world-screen">
      <div className="world-hero">
        <div className="world-copy">
          <span className="mode-pill">Paper 3 World Map</span>
          <h2>{world.name}</h2>
          <p>Choose a region, restore it through real marks and reflection, and keep the academy growing one official question at a time. Progress is an estimate from attempts, marks, and mistake patterns.</p>
        </div>
        <div className="academy-crest-art" aria-hidden="true">
          <svg viewBox="0 0 260 180" role="img">
            <path className="academy-bridge" d="M22 136c42-28 78-42 108-42s66 14 108 42" />
            <path className="academy-tower academy-tower-main" d="M112 138V64l18-32 18 32v74Z" />
            <path className="academy-tower" d="M62 142V88l14-24 14 24v54Z" />
            <path className="academy-tower" d="M172 142V88l14-24 14 24v54Z" />
            <path className="academy-window" d="M126 82h8v20h-8zM72 104h8v16h-8zM182 104h8v16h-8z" />
            <path className="academy-constellation" d="M43 38 74 24l38 18 42-28 50 30" />
            <circle cx="43" cy="38" r="3" />
            <circle cx="74" cy="24" r="3" />
            <circle cx="112" cy="42" r="3" />
            <circle cx="154" cy="14" r="3" />
            <circle cx="204" cy="44" r="3" />
          </svg>
        </div>
        <div className="world-actions">
          <button className="primary-button" type="button" onClick={onReviewWeak}>Review Weak Areas</button>
          <button type="button" onClick={onTeacher}>Teacher/Export</button>
        </div>
      </div>

      {recommended ? (
        <div className="quest-banner">
          <div className="quest-icon" aria-hidden="true"><Target size={20} /></div>
          <div>
            <span>Recommended quest</span>
            <strong>{recommended.region.name}</strong>
            <p>{recommendedGoal?.label ?? 'Restore the next wing with real marks and reflection.'}</p>
          </div>
          <button className="primary-button" type="button" disabled={!canStartRecommended} onClick={() => recommended && onTrain(recommended.region)}>
            Start recommended quest <ChevronRight size={16} />
          </button>
        </div>
      ) : null}

      {notice ? <div className="world-notice">{notice}</div> : null}

      <div className="academy-summary" aria-label="Academy progress summary">
        <div><Trophy size={18} /><span>Academy title</span><strong>{summary.title}</strong></div>
        <div><BookOpenCheck size={18} /><span>Attempts logged</span><strong>{summary.attempts}</strong></div>
        <div><FileText size={18} /><span>Evidence XP</span><strong>{summary.totalXp}</strong></div>
        <div><Target size={18} /><span>Estimated average</span><strong>{percent(summary.averageScoreRatio)}</strong></div>
      </div>

      <div className="academy-map" aria-label={`${world.name} regions`}>
        {progress.map((regionProgress, index) => {
          const { region } = regionProgress;
          const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
          const goal = nextRegionGoal(regionProgress);
          const isRecommended = summary.recommendedRegionName === region.name;
          return (
            <article
              className={`region-card region-${region.id} rank-${regionProgress.rank.toLowerCase()}${isRecommended ? ' recommended-region' : ''}`}
              key={region.id}
              style={{ '--region-delay': `${index * 40}ms` } as CSSProperties}
            >
              <div className="region-orbit" aria-hidden="true">{rankSymbol(regionProgress.rank)}</div>
              <div className="region-glyph" aria-hidden="true">{regionGlyph(region.id)}</div>
              <div className="region-card-header">
                <div>
                  <span className="region-state">{isRecommended ? 'Recommended quest' : canTrain ? 'Active region' : regionProgress.isActive ? 'No questions loaded yet' : 'Dormant wing'}</span>
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
                <span>{goal.label}</span>
              </div>
              <button type="button" disabled={!canTrain} onClick={() => onTrain(region)}>
                {canTrain ? 'Train in this region' : regionProgress.isActive ? 'No questions loaded yet' : 'Coming soon'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
