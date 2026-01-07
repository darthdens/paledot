import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { Turntable } from "@/components/vinyl/Turntable";
import { RecordCollection } from "@/components/vinyl/RecordCollection";
import { VinylControls } from "@/components/vinyl/VinylControls";
import type { VinylRecord, RPMSpeed } from "@/components/vinyl/types";

// Sample vinyl collection
const vinylCollection: VinylRecord[] = [
  {
    id: "midnight-drive",
    artist: "Neon Pulse",
    album: "Midnight Drive",
    year: 2023,
    color: "transparent-purple",
    labelImage: "/vinyl/midnight-drive-label.svg",
  },
  {
    id: "ocean-waves",
    artist: "Coastal Dreams",
    album: "Ocean Waves",
    year: 2021,
    color: "ocean-blue-marble",
    labelImage: "/vinyl/ocean-waves-label.svg",
  },
  {
    id: "golden-hour",
    artist: "The Sunset Collective",
    album: "Golden Hour",
    year: 2022,
    color: "gold-orange-swirl",
    labelImage: "/vinyl/golden-hour-label.svg",
  },
  {
    id: "noir",
    artist: "Shadow District",
    album: "Noir",
    year: 2020,
    color: "classic-black",
    labelImage: "/vinyl/noir-label.svg",
  },
  {
    id: "electric-dreams",
    artist: "Synthwave Masters",
    album: "Electric Dreams",
    year: 2024,
    color: "hot-pink",
    labelImage: "/vinyl/electric-dreams-label.svg",
  },
  {
    id: "forest-echo",
    artist: "Nature Sounds",
    album: "Forest Echo",
    year: 2019,
    color: "forest-green",
    labelImage: "/vinyl/forest-echo-label.svg",
  },
];

const VinylPlayer = () => {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [speed, setSpeed] = useState<RPMSpeed>(33);
  const [volume, setVolume] = useState(50);
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(vinylCollection[0]);
  const [tonearmPosition, setTonearmPosition] = useState<"rest" | "playing">("rest");
  const [isSwapping, setIsSwapping] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    document.title =
      language === "fr"
        ? "Platine Vinyle Interactive | Par Dens"
        : "Interactive Vinyl Player | By Dens";
  }, [language]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (!isPoweredOn || !selectedRecord) return;
    
    if (isPlaying) {
      setTonearmPosition("rest");
      setTimeout(() => setIsPlaying(false), 500);
    } else {
      setIsPlaying(true);
      setTimeout(() => setTonearmPosition("playing"), 100);
    }
  };

  // Handle power toggle
  const handlePowerToggle = () => {
    if (isPoweredOn) {
      setIsPlaying(false);
      setTonearmPosition("rest");
    }
    setIsPoweredOn(!isPoweredOn);
  };

  // Handle record selection
  const handleSelectRecord = (record: VinylRecord) => {
    if (record.id === selectedRecord?.id) return;
    
    // Stop playing and animate tonearm away
    if (isPlaying) {
      setTonearmPosition("rest");
      setIsPlaying(false);
    }
    
    // Animate record swap
    setIsSwapping(true);
    setTimeout(() => {
      setSelectedRecord(record);
      setTimeout(() => setIsSwapping(false), 300);
    }, 300);
  };

  // Vinyl crackle audio (optional ambient sound)
  useEffect(() => {
    if (isPlaying && isPoweredOn) {
      // Could add ambient vinyl crackle here
    }
  }, [isPlaying, isPoweredOn]);

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      <Starfield />
      <Navigation />

      <main className="flex-1 relative z-10 pt-16">
        {/* Hero Section */}
        <section className="min-h-[20vh] flex items-center justify-center pt-12 md:pt-16 pb-6 md:pb-8">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                {t.vinylPlayer.title}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                {t.vinylPlayer.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Turntable Section */}
        <section className="container mx-auto px-4 sm:px-6 max-w-6xl pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Main Turntable */}
            <div className="flex-1 w-full">
              <Turntable
                record={selectedRecord}
                isPlaying={isPlaying && isPoweredOn}
                isPoweredOn={isPoweredOn}
                speed={speed}
                tonearmPosition={tonearmPosition}
                isSwapping={isSwapping}
              />
              
              {/* Controls below turntable */}
              <VinylControls
                isPlaying={isPlaying}
                isPoweredOn={isPoweredOn}
                speed={speed}
                volume={volume}
                onPlayPause={handlePlayPause}
                onPowerToggle={handlePowerToggle}
                onSpeedChange={setSpeed}
                onVolumeChange={setVolume}
                hasRecord={!!selectedRecord}
              />
            </div>

            {/* Record Collection Sidebar */}
            <div className="w-full lg:w-80">
              <RecordCollection
                records={vinylCollection}
                selectedRecord={selectedRecord}
                onSelectRecord={handleSelectRecord}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VinylPlayer;
