import { describe, expect, it } from 'vitest';
import { getRegionFieldGuide } from '../data/regionFieldGuides';
import { P3_ASTRAL_ACADEMY } from '../lib/worldMap';

function guideText(regionId: string): string {
  const region = P3_ASTRAL_ACADEMY.regions.find((candidate) => candidate.id === regionId);
  if (!region) throw new Error(`Missing region ${regionId}`);
  const guide = getRegionFieldGuide(region);

  return [
    guide.topic,
    ...guide.whatToRecognize,
    ...guide.commonExamMoves,
    ...guide.commonTraps,
    ...guide.readinessChecklist,
    ...guide.workedExamples.flatMap((example) => [
      example.title,
      example.focus,
      example.setup ?? '',
      ...example.steps,
      example.answer,
      example.keyMove,
      example.check,
      example.why,
    ]),
  ].join('\n');
}

describe('region field guide P3 scope guardrails', () => {
  it('keeps reviewed scope-risk phrases out of the student-facing field guide copy', () => {
    const allGuideText = P3_ASTRAL_ACADEMY.regions.map((region) => guideText(region.id)).join('\n');

    expect(allGuideText).not.toMatch(/De Moivre/i);
    expect(allGuideText).not.toMatch(/cube roots/i);
    expect(allGuideText).not.toMatch(/all roots/i);
    expect(allGuideText).not.toMatch(/shortest-route/i);
    expect(allGuideText).not.toMatch(/inverse function/i);
    expect(allGuideText).not.toMatch(/choose substitution when/i);
  });

  it('anchors the corrected guide examples to P3-specific syllabus moves', () => {
    expect(guideText('algebra-forge')).toContain('rational-index binomial expansion');
    expect(guideText('algebra-forge')).toContain('|x|<\\frac12');
    expect(guideText('complex-harbor')).toContain('two square roots');
    expect(guideText('integration-gardens')).toContain('Use the substitution stated in the question');
    expect(guideText('vector-workshop')).toContain('point-to-line prompts');
  });
});
