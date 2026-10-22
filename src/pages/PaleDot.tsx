import { useEffect, useState } from "react";

import { CosmosExplorer } from "@/components/cosmos/CosmosExplorer";
import { WebGLBoundary } from "@/components/cosmos/WebGLBoundary";
import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotTitleScreen } from "@/brand/paledot/PaleDotTitleScreen";
import { useCosmosStore } from "@/components/cosmos/store/useCosmosStore";
import { PaleDotEndFrame } from "@/brand/paledot/PaleDotEndFrame";
import { getObjectById } from "@/components/cosmos/data/celestialObjects";

const PaleDot = () => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

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
    useCosmosStore.getState().setShowControlHints(true);
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
    return <PaleDotTitleScreen onBegin={() => setStarted(true)} />;
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
      <WebGLBoundary>
        <CosmosExplorer />
      </WebGLBoundary>
      {ended && (
        <PaleDotEndFrame
          distance={tx("46.5 billion light-years", "46,5 milliards d’années-lumière")}
          onAgain={goAgain}
        />
      )}
    </div>
  );
};

export default PaleDot;
