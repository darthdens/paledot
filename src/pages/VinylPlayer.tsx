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
  },
  {
    id: "ocean-waves",
    artist: "Coastal Dreams",
    album: "Ocean Waves",
    year: 2021,
    color: "ocean-blue-marble",
  },
  {
    id: "golden-hour",
    artist: "The Sunset Collective",
    album: "Golden Hour",
    year: 2022,
    color: "gold-orange-swirl",
  },
  {
    id: "noir",
    artist: "Shadow District",
    album: "Noir",
    year: 2020,
    color: "classic-black",
  },
  {
    id: "electric-dreams",
    artist: "Synthwave Masters",
    album: "Electric Dreams",
    year: 2024,
    color: "hot-pink",
  },
  {
    id: "forest-echo",
    artist: "Nature Sounds",
    album: "Forest Echo",
    year: 2019,
    color: "forest-green",
  },
  {
    id: "crimson-heart",
    artist: "The Romantics",
    album: "Crimson Heart",
    year: 2022,
    color: "blood-red",
  },
  {
    id: "summer-haze",
    artist: "The Beach Collective",
    album: "Summer Haze",
    year: 2021,
    color: "sunset-gradient",
  },
  {
    id: "arctic-silence",
    artist: "Frozen Echoes",
    album: "Arctic Silence",
    year: 2024,
    color: "ice-white",
  },
  {
    id: "honey-drip",
    artist: "Mellow Groove",
    album: "Honey Drip",
    year: 2020,
    color: "amber-honey",
  },
  {
    id: "deep-space",
    artist: "Cosmic Voyagers",
    album: "Deep Space",
    year: 2023,
    color: "midnight-blue",
  },
  {
    id: "tropical-sunrise",
    artist: "Island Breeze",
    album: "Tropical Sunrise",
    year: 2022,
    color: "coral-peach",
  },
  {
    id: "velvet-nights",
    artist: "Luna Noir",
    album: "Velvet Nights",
    year: 2022,
    color: "classic-black",
  },
  {
    id: "cyber-city",
    artist: "Digital Horizon",
    album: "Cyber City 2099",
    year: 2024,
    color: "transparent-purple",
  },
  {
    id: "wilderness",
    artist: "Mountain Echo",
    album: "Wilderness",
    year: 2018,
    color: "forest-green",
  },
  {
    id: "retro-wave",
    artist: "80s Revival",
    album: "Retro Wave",
    year: 2021,
    color: "hot-pink",
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
  const [turntableHeight, setTurntableHeight] = useState<number>(0);
  const turntableRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync turntable height for side panels
  useEffect(() => {
    const updateHeight = () => {
      if (turntableRef.current) {
        setTurntableHeight(turntableRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

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
        <section className="container mx-auto px-4 sm:px-6 max-w-7xl pb-8">
          {/* Desktop Layout - Grid with 3 columns */}
          <div className="hidden lg:grid lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] gap-8 items-start">
            {/* Controls - Left side */}
            <div style={{ height: turntableHeight > 0 ? `${turntableHeight}px` : undefined }}>
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
                vertical
              />
            </div>

            {/* Main Turntable - Center */}
            <div ref={turntableRef} className="w-full max-w-xl mx-auto aspect-square justify-self-center">
              <Turntable
                record={selectedRecord}
                isPlaying={isPlaying && isPoweredOn}
                isPoweredOn={isPoweredOn}
                speed={speed}
                tonearmPosition={tonearmPosition}
                isSwapping={isSwapping}
              />
            </div>

            {/* Record Collection - Right side */}
            <div style={{ height: turntableHeight > 0 ? `${turntableHeight}px` : undefined }}>
              <RecordCollection
                records={vinylCollection}
                selectedRecord={selectedRecord}
                onSelectRecord={handleSelectRecord}
              />
            </div>
          </div>

          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden flex flex-col gap-8">
            {/* Main Turntable */}
            <div className="w-full max-w-xl mx-auto aspect-square">
              <Turntable
                record={selectedRecord}
                isPlaying={isPlaying && isPoweredOn}
                isPoweredOn={isPoweredOn}
                speed={speed}
                tonearmPosition={tonearmPosition}
                isSwapping={isSwapping}
              />
            </div>
            
            {/* Controls */}
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

            {/* Record Collection */}
            <RecordCollection
              records={vinylCollection}
              selectedRecord={selectedRecord}
              onSelectRecord={handleSelectRecord}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VinylPlayer;
