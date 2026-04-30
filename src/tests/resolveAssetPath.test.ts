import { describe, expect, it } from 'vitest';
import { resolveQuestionAssetPath, resolveQuestionAssetPathCandidateGroups, resolveQuestionAssetPathCandidates } from '../lib/resolveAssetPath';

describe('resolveQuestionAssetPath', () => {
  it('maps p3 relative paths into public asset URLs', () => {
    expect(resolveQuestionAssetPath('p3/15autumn25/questions/q01.png')).toBe('/assets/15autumn25/questions/q01.png');
    expect(resolveQuestionAssetPath('p3/15autumn25/mark_scheme/q01.png')).toBe('/assets/15autumn25/mark_scheme/q01.png');
  });

  it('generates current, family-folder, and old paper-only candidates in order', () => {
    expect(resolveQuestionAssetPathCandidates('p3/31autumn21/questions/q01.png')).toEqual([
      '/assets/31autumn21/questions/q01.png',
      '/assets/questions/p3/31autumn21/questions/q01.png',
      '/assets/questions/31autumn21/questions/q01.png',
    ]);
    expect(resolveQuestionAssetPathCandidates('p3/31autumn21/mark_scheme/q01.png')).toEqual([
      '/assets/31autumn21/mark_scheme/q01.png',
      '/assets/questions/p3/31autumn21/mark_scheme/q01.png',
      '/assets/questions/31autumn21/mark_scheme/q01.png',
    ]);
  });

  it('keeps older planned layout candidates available', () => {
    expect(resolveQuestionAssetPathCandidates('p3/15autumn25/questions/q01.png')).toContain(
      '/assets/questions/p3/15autumn25/questions/q01.png',
    );
    expect(resolveQuestionAssetPathCandidates('p3/15autumn25/mark_scheme/q01.png')).toContain(
      '/assets/questions/p3/15autumn25/mark_scheme/q01.png',
    );
  });

  it('canonicalizes supported public path variants without duplicated family folders', () => {
    expect(resolveQuestionAssetPath('/p3/15autumn25/questions/q01.png')).toBe('/assets/15autumn25/questions/q01.png');
    expect(resolveQuestionAssetPath('assets/questions/p3/x/q.png')).toBe('/assets/x/q.png');
    expect(resolveQuestionAssetPath('/assets/questions/p3/15autumn25/questions/q01.png')).toBe('/assets/15autumn25/questions/q01.png');
    expect(resolveQuestionAssetPath('public/assets/questions/p3/15autumn25/questions/q01.png')).toBe('/assets/15autumn25/questions/q01.png');
    expect(resolveQuestionAssetPathCandidates('public/assets/questions/p3/15autumn25/questions/q01.png')).not.toContain('/assets/questions/p3/p3/15autumn25/questions/q01.png');
    expect(resolveQuestionAssetPathCandidates('/assets/questions/15autumn25/questions/q01.png')).toEqual([
      '/assets/15autumn25/questions/q01.png',
      '/assets/questions/p3/15autumn25/questions/q01.png',
      '/assets/questions/15autumn25/questions/q01.png',
    ]);
  });

  it('uses fallback family when the path has no family prefix', () => {
    expect(resolveQuestionAssetPath('15autumn25/questions/q01.png', 'p5')).toBe('/assets/15autumn25/questions/q01.png');
  });

  it('preserves array fallback groups in order', () => {
    expect(resolveQuestionAssetPathCandidateGroups(['p3/a/questions/q1.png', 'p3/a/questions/q2.png'])).toEqual([
      ['/assets/a/questions/q1.png', '/assets/questions/p3/a/questions/q1.png', '/assets/questions/a/questions/q1.png'],
      ['/assets/a/questions/q2.png', '/assets/questions/p3/a/questions/q2.png', '/assets/questions/a/questions/q2.png'],
    ]);
  });
});
