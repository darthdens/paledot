// Left Behind · built during NASA Space Apps Challenge 2026 (14–15 Nov 2026) · AI-assisted (Lovable, Claude)
import { useEffect } from 'react';
/** Measure UI changes, never scene frames; dropdowns stop above whichever bottom card is open. */
export function useOverlayClearance(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el=root.current; if(!el)return;
    let frame=0;
    const measure=()=>{
      frame=0;
      const bounds=el.getBoundingClientRect();
      const toolbar=el.querySelector('[data-explorer-toolbar]')?.getBoundingClientRect();
      const search=el.querySelector('[data-object-search]')?.getBoundingClientRect();
      const top=Math.max(toolbar?.bottom??bounds.top+52,search?.bottom??0)+8;
      let bottom=Math.min(bounds.bottom,window.visualViewport?.height??innerHeight)-8;
      for(const card of el.querySelectorAll('[data-bottom-card],[data-tour-panel],[data-machine-readout]')){
        const r=card.getBoundingClientRect();if(r.height>0)bottom=Math.min(bottom,r.top-8);
      }
      el.style.setProperty('--pd-dropdown-top',`${top-bounds.top}px`);
      el.style.setProperty('--pd-dropdown-height',`${Math.max(44,bottom-top)}px`);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
    const resize=new ResizeObserver(schedule);
    const bind=()=>{resize.disconnect();resize.observe(el);for(const node of el.querySelectorAll('[data-explorer-toolbar],[data-object-search],[data-bottom-card],[data-tour-panel],[data-machine-readout]'))resize.observe(node);schedule();};
    const mutation=new MutationObserver(bind);mutation.observe(el,{childList:true,subtree:true});bind();
    window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);};
  },[root]);
}