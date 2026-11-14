// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
/** Fill from the start until capacity; only shift when full, never draw unfilled zeros. */
export function appendTrailPoint(buffer: Float32Array, count: number, point: [number,number,number]) {
  const capacity=buffer.length/3;
  if(capacity<1)return 0;
  if(count>=capacity)buffer.copyWithin(0,3);
  const index=Math.min(count,capacity-1)*3;
  buffer.set(point,index);
  return Math.min(count+1,capacity);
}