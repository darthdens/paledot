// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { downloadBlob } from '../data/download';
/** Requests a photo only when its slot is visible, then releases its object URL on unmount. */
export function ProgressImage({ src, loading, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useRef<HTMLImageElement>(null);
  const [resolved, setResolved] = useState<string>();
  const [visible, setVisible] = useState(loading !== 'lazy');
  useEffect(() => {
    if (visible || !ref.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) setVisible(true); });
    observer.observe(ref.current); return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    if (!visible || !src) return;
    const controller = new AbortController(); let objectUrl: string | undefined;
    setResolved(undefined);
    void downloadBlob(src, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob); setResolved(objectUrl);
    }).catch(() => { if (!controller.signal.aborted) setResolved(src); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src, visible]);
  return <img {...props} ref={ref} src={resolved} />;
}