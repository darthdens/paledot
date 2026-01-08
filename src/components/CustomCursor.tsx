import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCosmosStore } from "@/components/cosmos/store/useCosmosStore";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isDown, setIsDown] = useState(false);
  const [isOnCosmos, setIsOnCosmos] = useState(false);
  
  // Get hovered object from cosmos store
  const hoveredObject = useCosmosStore(state => state.hoveredObject);

  // In native fullscreen, only the fullscreen element (and its children) are rendered.
  // Portal the cursor into the fullscreen element so it remains visible.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const updateTarget = () => {
      const doc = document as any;
      const el = (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement) as HTMLElement | null;
      setPortalTarget(el ?? null);
    };

    updateTarget();
    document.addEventListener('fullscreenchange', updateTarget);
    document.addEventListener('webkitfullscreenchange', updateTarget);
    document.addEventListener('mozfullscreenchange', updateTarget);

    return () => {
      document.removeEventListener('fullscreenchange', updateTarget);
      document.removeEventListener('webkitfullscreenchange', updateTarget);
      document.removeEventListener('mozfullscreenchange', updateTarget);
    };
  }, []);

  useEffect(() => {
    // Only enable on devices that actually have a precise pointer (mouse/trackpad)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onPointerMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      setIsVisible(true);
    };

    const onPointerDown = () => setIsDown(true);
    const onPointerUp = () => setIsDown(false);

    const onMouseOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest(
        "a[href], button[type='submit'], .nav-link, [data-external]"
      );
      setIsPointer(Boolean(el));

      // Check if hovering over cosmos container
      const cosmosEl = (e.target as HTMLElement | null)?.closest('[data-cosmos-container]');
      setIsOnCosmos(Boolean(cosmosEl));
    };

    const onEnter = () => setIsVisible(true);
    const onLeave = () => setIsVisible(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    const animate = () => {
      current.current.x = target.current.x;
      current.current.y = target.current.y;

      const node = cursorRef.current;
      if (node) {
        node.style.left = `${current.current.x}px`;
        node.style.top = `${current.current.y}px`;
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Show pointer style when hovering a cosmos object
  const showPointer = isPointer || (isOnCosmos && hoveredObject !== null);

  const cursorNode = (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={cn(
        "custom-cursor",
        isVisible && "is-visible",
        showPointer && "is-pointer",
        isDown && "is-down",
        isOnCosmos && "is-cosmos"
      )}
    >
      <div className="custom-cursor__ring">
        <ArrowUpRight className="custom-cursor__icon" />
      </div>
      <div className="custom-cursor__dot" />
    </div>
  );

  return portalTarget ? createPortal(cursorNode, portalTarget) : cursorNode;
}
