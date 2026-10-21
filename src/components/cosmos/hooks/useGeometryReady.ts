import { useEffect, useRef } from 'react';
import { useCosmosStore } from '../store/useCosmosStore';

/**
 * Hook that signals when a geometry is ready.
 * Call this after useMemo generates heavy geometry.
 */
export const useGeometryReady = (geometryId: string, isReady: boolean = true) => {
  const markGeometryReady = useCosmosStore((s) => s.markGeometryReady);
  const hasSignaled = useRef(false);

  useEffect(() => {
    if (isReady && !hasSignaled.current) {
      hasSignaled.current = true;
      // Use requestIdleCallback or setTimeout to signal after geometry is fully constructed
      const id = window.setTimeout(() => {
        markGeometryReady(geometryId);
      }, 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [isReady, geometryId, markGeometryReady]);
};
