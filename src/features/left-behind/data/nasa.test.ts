// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { describe, expect, it } from 'vitest';
import hardware from '../../../../public/left-behind/hardware.json';
import { acceptablePhoto, buildTrajectory, parseVectors, planWindows } from './nasa';
import type { Machine } from './types';
const machines: Machine[] = hardware.machines;
const voyager = machines.find(machine => machine.id === 'voyager-1');

describe('Left Behind source and sampling rules', () => {
  it('contains exactly the nine requested trajectory ids', () => {
    expect(machines.flatMap(machine => machine.trajectories.map(trajectory => trajectory.id)).sort()).toEqual(['apollo-11', 'apollo-15', 'apollo-16', 'apollo-17', 'ingenuity', 'opportunity', 'viking-1', 'voyager-1', 'voyager-2']);
  });
  it('samples the first year daily', () => {
    if (!voyager?.trajectories[0]) throw new Error('Missing Voyager');
    expect(planWindows(voyager.trajectories[0], voyager)[0]?.stepSeconds).toBe(86400);
  });
  it('samples later flight at five-day steps', () => {
    if (!voyager?.trajectories[0]) throw new Error('Missing Voyager');
    const windows = planWindows(voyager.trajectories[0], voyager);
    expect(windows[windows.length - 1]?.stepSeconds).toBe(432000);
  });
  it('samples ten days either side of encounters hourly', () => {
    if (!voyager?.trajectories[0]) throw new Error('Missing Voyager');
    const date = Date.parse('1979-03-05');
    expect(planWindows(voyager.trajectories[0], voyager).find(window => window.from === date - 10 * 86400000)).toMatchObject({ to: date + 10 * 86400000, stepSeconds: 3600 });
  });
  it('keeps Apollo paths simplified with actual milestone dates and no invented vectors', async () => {
    const machine = machines.find(machine => machine.id === 'apollo-11');
    if (!machine?.trajectories[0]) throw new Error('Missing Apollo');
    const result = await buildTrajectory(machine.trajectories[0], machine);
    expect(result).toMatchObject({ source: 'simplified', milestones: { launch: '1969-07-16T13:32:00Z', arrival: '1969-07-20T20:17:00Z' } });
    expect(result.segments).toBeUndefined();
  });
  it('rounds vectors to whole kilometres without changing orientation', () => {
    expect(parseVectors('$$SOE\n2451545.0, A.D. 2000-Jan-01, 1.6, -2.7, 3.2,\n$$EOE')).toEqual({ start: '2000-01-01T12:00:00.000Z', positions: [[2, -3, 3]] });
  });
  it('excludes logos and insignia from photograph selection', () => {
    if (!voyager) throw new Error('Missing Voyager');
    expect(acceptablePhoto({ data: [{ nasa_id: 'x', title: 'Voyager logo', keywords: [] }] }, voyager)).toBe(false);
    expect(acceptablePhoto({ data: [{ nasa_id: 'x', title: 'Voyager spacecraft', keywords: ['patch'] }] }, voyager)).toBe(false);
    expect(acceptablePhoto({ data: [{ nasa_id: 'x', title: 'Voyager 1 spacecraft testing', description: 'Voyager 1 spacecraft before launch.', keywords: [] }] }, voyager, 'Voyager spacecraft')).toBe(true);
  });
  it('never assigns a Voyager 2 image to Voyager 1', () => {
    if (!voyager) throw new Error('Missing Voyager');
    expect(acceptablePhoto({ data: [{ nasa_id: 'PIA22915', title: 'Voyager 2 Spacecraft Instruments' }] }, voyager, 'Voyager spacecraft')).toBe(false);
  });
  it('accepts a description-qualified Apollo reflector photograph', () => {
    const machine = machines.find(m => m.id === 'apollo-11');
    if (!machine) throw new Error('Missing Apollo');
    expect(acceptablePhoto({ data: [{ nasa_id: '6900957', title: 'Saturn Apollo Program', description: 'Apollo 11 astronaut carrying the Laser Ranging Retroreflector.' }] }, machine, 'Apollo 11 laser ranging retroreflector')).toBe(true);
  });
  it('requires Ingenuity first-flight hardware instead of an aerial image it took', () => {
    const machine = machines.find(m => m.id === 'ingenuity');
    if (!machine) throw new Error('Missing Ingenuity');
    expect(acceptablePhoto({ data: [{ nasa_id: 'PIA24593', title: 'First Aerial Color Image of Mars', description: 'Ingenuity Mars Helicopter first flight.' }] }, machine, 'Ingenuity Mars helicopter first flight')).toBe(false);
    expect(acceptablePhoto({ data: [{ nasa_id: 'PIA24586', title: "Perseverance’s Navcam View of Ingenuity’s First Flight", description: 'Ingenuity Mars Helicopter hovering.' }] }, machine, 'Ingenuity Mars helicopter first flight')).toBe(true);
  });
});