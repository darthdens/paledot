import { useEffect, useState } from "react";

import { CosmosExplorer } from "@/components/cosmos/CosmosExplorer";
import { WebGLBoundary } from "@/components/cosmos/WebGLBoundary";
import { useLanguage } from "@/i18n/LanguageContext";
import { PaleDotTitleScreen } from "@/brand/paledot/PaleDotTitleScreen";

const PaleDot = () => {
  const { language } = useLanguage();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    document.title =
      language === "fr"
        ? "Pale Dot — De la Terre aux confins de tout"
        : "Pale Dot — From Earth to the edge of everything";
  }, [language]);

  if (!started) {
    return <PaleDotTitleScreen onBegin={() => setStarted(true)} />;
  }

  return (
    <div
      className="paledot dark fixed inset-0 w-screen overflow-hidden"
      style={{
        height: "100dvh",
        backgroundColor: "#0A0B10",
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
