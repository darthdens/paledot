// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { expect, it } from 'vitest';
import { tourOptions } from './tourOptions';
it('offers the original tour and seven machine tours without launching unfinished tours', () => {
  expect(tourOptions.map(option => option.id)).toEqual(['begin-at-earth','apollo-11','lunar-rovers','viking-1','opportunity','ingenuity','voyager-2','voyager-1']);
  expect(tourOptions.filter(option => option.available).map(option => option.id)).toEqual(['begin-at-earth']);
});