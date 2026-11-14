// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluateTrajectory } from './trajectory';
import { AU_KM, helioPositionKm, moonPositionKm } from './ephemeris';
import type { Trajectory } from '../data/types';
const fixture:Trajectory={id:'test',source:'horizons',segments:[{center:'sun',start:'2000-01-01T00:00:00Z',stepSeconds:60,positions:[[0,2,4],[10,12,14]]}]};
const stored=(id:string)=>JSON.parse(readFileSync(`public/left-behind/trajectories/${id}.json`,'utf8')) as Trajectory;
it('interpolates the exact midpoint of neighbouring points',()=>{expect(evaluateTrajectory(fixture,new Date('2000-01-01T00:00:30Z'))?.km).toEqual([5,7,9]);});
it('returns null outside every segment for ordinary machines',()=>{expect(evaluateTrajectory(fixture,new Date('1999-12-31'))).toBeNull();expect(evaluateTrajectory(fixture,new Date('2000-01-02'))).toBeNull();});
it('prefers the finest step where segments overlap',()=>{expect(evaluateTrajectory({...fixture,segments:[...(fixture.segments??[]),{center:'sun',start:'2000-01-01T00:00:00Z',stepSeconds:30,positions:[[100,100,100],[200,200,200],[300,300,300]]}]},new Date('2000-01-01T00:00:30Z'))?.km).toEqual([200,200,200]);});
it('adds the center body in heliocentric ecliptic kilometres',()=>{const date=new Date('2000-01-01T00:00:30Z');const earth=helioPositionKm('earth',date);expect(evaluateTrajectory({...fixture,segments:fixture.segments?.map(s=>({...s,center:'earth'}))},date)?.km).toEqual(earth.map((v,i)=>v+([5,7,9][i]??0)));});
it('does not bridge missing Voyager intervals',()=>{expect(evaluateTrajectory({...fixture,id:'voyager-1',segments:[...(fixture.segments??[]),{center:'sun',start:'2000-01-03',stepSeconds:60,positions:[[1,2,3],[4,5,6]]}]},new Date('2000-01-02'))).toBeNull();});
it('extrapolates Voyagers only using their final velocity',()=>{const p=evaluateTrajectory({...fixture,id:'voyager-1'},new Date('2000-01-01T00:02:00Z'));expect(p?.km).toEqual([20,22,24]);expect(p?.extrapolated).toBe(true);});
it('a simplified lunar arc arrives at the Moon and is hidden outside the flight',()=>{const data=stored('apollo-11');const date=new Date('1969-07-20T20:17:00Z');expect(evaluateTrajectory(data,date)?.km).toEqual(moonPositionKm(date));expect(evaluateTrajectory(data,new Date('1969-07-21'))).toBeNull();});
describe('saved Voyager milestone acceptance',()=>{
  it('Voyager 1 is within one million km of Jupiter on 5 March 1979',()=>{const date=new Date('1979-03-05T00:00:00Z');const p=evaluateTrajectory(stored('voyager-1'),date);expect(p).not.toBeNull();expect(Math.hypot(...(p?.km??[]).map((v,i)=>v-(helioPositionKm('jupiter',date)[i]??0)))).toBeLessThan(1000000);});
  it('Voyager 1 is within one million km of Saturn during 12 November 1980',()=>{const date=new Date('1980-11-12T12:00:00Z');const p=evaluateTrajectory(stored('voyager-1'),date);expect(p).not.toBeNull();expect(Math.hypot(...(p?.km??[]).map((v,i)=>v-(helioPositionKm('saturn',date)[i]??0)))).toBeLessThan(1000000);});
  it('Voyager 1 climbs out of the planetary plane after Saturn',()=>{const before=evaluateTrajectory(stored('voyager-1'),new Date('1980-11-12'));const after=evaluateTrajectory(stored('voyager-1'),new Date('1982-11-12'));expect(Math.abs(after?.km[2]??0)).toBeGreaterThan(Math.abs(before?.km[2]??0)+AU_KM);});
  it('Voyager 2 is within one million km of Neptune on 25 August 1989',()=>{const date=new Date('1989-08-25');const p=evaluateTrajectory(stored('voyager-2'),date);expect(p).not.toBeNull();expect(Math.hypot(...(p?.km??[]).map((v,i)=>v-(helioPositionKm('neptune',date)[i]??0)))).toBeLessThan(1000000);});
  it('Voyager 1 is about 121 AU out on 25 August 2012',()=>{const p=evaluateTrajectory(stored('voyager-1'),new Date('2012-08-25'));expect(p).not.toBeNull();expect(Math.abs(Math.hypot(...(p?.km??[]))/AU_KM-121)).toBeLessThan(1);});
  it('Voyager 2 is about 119 AU out on 5 November 2018',()=>{const p=evaluateTrajectory(stored('voyager-2'),new Date('2018-11-05'));expect(p).not.toBeNull();expect(Math.abs(Math.hypot(...(p?.km??[]))/AU_KM-119)).toBeLessThan(1);});
});