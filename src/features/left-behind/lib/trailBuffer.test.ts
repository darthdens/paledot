// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { expect,it } from 'vitest';
import { appendTrailPoint } from './trailBuffer';
it('draws the first real points instead of an unfilled origin prefix',()=>{
  const buffer=new Float32Array(9);let count=appendTrailPoint(buffer,0,[100,200,300]);
  count=appendTrailPoint(buffer,count,[110,210,310]);
  expect(count).toBe(2);expect(Array.from(buffer.slice(0,count*3))).toEqual([100,200,300,110,210,310]);
});
it('drops only the oldest point once the trail is full',()=>{
  const buffer=new Float32Array(6);let count=appendTrailPoint(buffer,0,[1,2,3]);
  count=appendTrailPoint(buffer,count,[4,5,6]);count=appendTrailPoint(buffer,count,[7,8,9]);
  expect(count).toBe(2);expect(Array.from(buffer)).toEqual([4,5,6,7,8,9]);
});