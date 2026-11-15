import { lazy, Suspense, useEffect, useState } from "react";

import { CosmosExplorer } from "@/components/cosmos/CosmosExplorer";
import { WebGLBoundary } from "@/components/cosmos/WebGLBoundary";
import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotTitleScreen } from "@/brand/paledot/PaleDotTitleScreen";
import { useCosmosStore } from "@/components/cosmos/store/useCosmosStore";
import { PaleDotEndFrame } from "@/brand/paledot/PaleDotEndFrame";
import { getObjectById } from "@/components/cosmos/data/celestialObjects";
import { useLeftBehindStore } from '@/features/left-behind/state/useLeftBehindStore';
import { SimulationDateReadout } from '@/features/left-behind/ui/SimulationDateReadout';
import { registerTours, hasTour } from '@/components/cosmos/data/tours';
import { leftBehindTours } from '@/features/left-behind/data/tours';

// Left Behind tours exist on the Pale Dot brand only.
registerTours(leftBehindTours);

const LeftBehindAdmin = lazy(() => import('@/features/left-behind/data/LeftBehindAdmin'));

const PaleDot = () => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [dataAdmin, setDataAdmin] = useState(false);
  useEffect(() => { setDataAdmin(new URLSearchParams(window.location.search).get('lb-admin') === '1'); }, []);
  useEffect(() => {
    const openHash = () => {
      const hash = window.location.hash;
      if (hash === '#lb-one-last-look') {
        useLeftBehindStore.setState({ pendingTourId: 'voyager-1', pendingStopId: 'voyager-1-one-last-look', menuOpen: false });
        setStarted(true);
        return;
      }
      // #lb-<tour-id>: start that tour once loading has finished (see CosmosExplorer).
      if (hash.startsWith('#lb-') && hasTour(hash.slice(4))) {
        useLeftBehindStore.setState({ pendingTourId: hash.slice(4), menuOpen: false });
        setStarted(true);
        return;
      }
      if (hash !== '#left-behind') return;
      useLeftBehindStore.getState().setMenuOpen(true);
      setStarted(true);
    };
    openHash();
    window.addEventListener('hashchange', openHash);
    return () => { window.removeEventListener('hashchange', openHash); useLeftBehindStore.getState().setMenuOpen(false); };
  }, []);

  // Normal system cursor everywhere on Pale Dot, including menus and tooltips rendered outside the page wrapper.
  useEffect(() => {
    document.documentElement.setAttribute("data-pd-cursor", "");
    return () => document.documentElement.removeAttribute("data-pd-cursor");
  }, []);

  // End frame: after the guided tour finishes, or when an explorer reaches the edge of the observable universe.
  useEffect(() => {
    if (!started) return;
    const show = () => setEnded(true);
    window.addEventListener("cosmos:journey-end", show);
    const unsub = useCosmosStore.subscribe((s, prev) => {
      const id = s.selectedObject?.id;
      if (id === "observable-universe" && prev.selectedObject?.id !== id && !s.isTouring) {
        window.setTimeout(show, 2500); // let the camera arrive first
      }
    });
    return () => {
      window.removeEventListener("cosmos:journey-end", show);
      unsub();
    };
  }, [started]);

  const goAgain = () => {
    setEnded(false);
    useCosmosStore.getState().startTour();
  };

  const goHome = () => {
    setEnded(false);
    const earth = getObjectById("earth");
    if (earth) useCosmosStore.getState().setSelectedObject(earth);
  };

  useEffect(() => {
    document.title =
      tx("Pale Dot — From Earth to the edge of everything", "Pale Dot — De la Terre aux confins de tout");
  }, [language]);

  // Once inside the explorer, paint Safari's top/bottom strips the same black as the 3D sky.
  useEffect(() => {
    if (!started) return;
    // Always land on "Welcome to Pale Dot" (guided tour / explore) once loading ends.
    useCosmosStore.getState().setShowControlHints(!useLeftBehindStore.getState().menuOpen);
    const color = "#000000";
    const els = [document.documentElement, document.body];
    const prev = els.map((el) => el.style.backgroundColor);
    els.forEach((el) => (el.style.backgroundColor = color));
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const prevMeta = metas.map((m) => m.content);
    metas.forEach((m) => (m.content = color));
    return () => {
      els.forEach((el, i) => (el.style.backgroundColor = prev[i] ?? ""));
      metas.forEach((m, i) => (m.content = prevMeta[i] ?? ""));
    };
  }, [started]);

  if (!started) {
    return <><PaleDotTitleScreen onBegin={() => setStarted(true)} onLeftBehind={() => { useLeftBehindStore.getState().setMenuOpen(true); setStarted(true); }} />{dataAdmin && <Suspense fallback={null}><LeftBehindAdmin /></Suspense>}<SimulationDateReadout /></>;
  }

  return (
    <div
      className="paledot dark fixed inset-0 w-screen overflow-hidden"
      style={{
        height: "100dvh",
        backgroundColor: "#000000",
        colorScheme: "dark",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      data-cosmos-container
      data-cosmos-native="true"
    >
      <div className="absolute inset-x-0 bottom-0 top-[calc(1.5rem+env(safe-area-inset-top))]">
        <WebGLBoundary>
          <CosmosExplorer />
        </WebGLBoundary>
      </div>
      {dataAdmin && <Suspense fallback={null}><LeftBehindAdmin /></Suspense>}
      {ended && (
        <PaleDotEndFrame
          distance={tx("46.5 billion light-years", "46,5 milliards d’années-lumière")}
          onAgain={goAgain}
          onHome={goHome}
        />
      )}
      <SimulationDateReadout />
    </div>
  );
};

export default PaleDot;
