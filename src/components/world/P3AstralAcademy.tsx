import type { CSSProperties } from 'react';
import type { RegionDefinition, RegionProgress, WorldDefinition } from '../../types';

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

export function P3AstralAcademy({ world, progress, notice, onTrain, onReviewWeak, onTeacher }: P3AstralAcademyProps) {
  return (
    <section className="world-screen">
      <div className="world-hero">
        <div>
          <span className="mode-pill">Paper 3 World Map</span>
          <h2>{world.name}</h2>
          <p>Choose a region, restore it through real marks and reflection, and keep the academy growing one question at a time.</p>
        </div>
        <div className="world-actions">
          <button className="primary-button" type="button" onClick={onReviewWeak}>Review Weak Areas</button>
          <button type="button" onClick={onTeacher}>Teacher/Export</button>
        </div>
      </div>

      {notice ? <div className="world-notice">{notice}</div> : null}

      <div className="academy-map" aria-label={`${world.name} regions`}>
        {progress.map((regionProgress, index) => {
          const { region } = regionProgress;
          const canTrain = regionProgress.isActive && regionProgress.availableQuestions > 0;
          return (
            <article
              className={`region-card region-${region.id} rank-${regionProgress.rank.toLowerCase()}`}
              key={region.id}
              style={{ '--region-delay': `${index * 40}ms` } as CSSProperties}
            >
              <div className="region-orbit" aria-hidden="true">{rankSymbol(regionProgress.rank)}</div>
              <div className="region-card-header">
                <div>
                  <span className="region-state">{canTrain ? 'Active region' : regionProgress.isActive ? 'No questions loaded yet' : 'Dormant wing'}</span>
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
              <button type="button" disabled={!canTrain} onClick={() => onTrain(region)}>
                {canTrain ? 'Train here' : regionProgress.isActive ? 'No questions loaded yet' : 'Coming soon'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
