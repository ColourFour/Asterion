import { describe, expect, it } from 'vitest';
import { resolveQuestionAssetPath } from '../lib/resolveAssetPath';

describe('resolveQuestionAssetPath', () => {
  it('maps p3 relative paths into public asset URLs', () => {
    expect(resolveQuestionAssetPath('p3/15autumn25/questions/q01.png')).toBe('/assets/questions/p3/15autumn25/questions/q01.png');
  });

  it('does not duplicate an existing assets prefix', () => {
    expect(resolveQuestionAssetPath('assets/questions/p3/x/q.png')).toBe('/assets/questions/p3/x/q.png');
  });

  it('uses fallback family when the path has no family prefix', () => {
    expect(resolveQuestionAssetPath('15autumn25/questions/q01.png', 'p5')).toBe('/assets/questions/p5/15autumn25/questions/q01.png');
  });
});
