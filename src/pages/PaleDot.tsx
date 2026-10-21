import { useEffect, useState } from "react";

import { CosmosExplorer } from "@/components/cosmos/CosmosExplorer";
import { WebGLBoundary } from "@/components/cosmos/WebGLBoundary";
import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotTitleScreen } from "@/brand/paledot/PaleDotTitleScreen";

const PaleDot = () => {
  const { language, tr, tx, numberLocale } = useLanguage();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    document.title =
      tx("Pale Dot — From Earth to the edge of everything", "Pale Dot — De la Terre aux confins de tout");
  }, [language]);

  // Once inside the explorer, paint Safari's top/bottom strips the same black as the 3D sky.
  useEffect(() => {
    if (!started) return;
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
    </div>
  );
};

export default PaleDot;
