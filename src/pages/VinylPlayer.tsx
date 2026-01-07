import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { Turntable } from "@/components/vinyl/Turntable";
import { RecordCollection } from "@/components/vinyl/RecordCollection";
import { VinylControls } from "@/components/vinyl/VinylControls";
import { useVinylAudio } from "@/hooks/use-vinyl-audio";
import type { VinylRecord, RPMSpeed } from "@/components/vinyl/types";

// Free music tracks from Pixabay (royalty-free)
const FREE_TRACKS = {
  lofi: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
  chill: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bd498b5.mp3",
  ambient: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_942034dc69.mp3",
  jazz: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3",
  electronic: "https://cdn.pixabay.com/download/audio/2023/07/14/audio_eb629e8c23.mp3",
  cinematic: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3",
  acoustic: "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3",
  piano: "https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32e02f9.mp3",
};

// Sample vinyl collection with tracks
const vinylCollection: VinylRecord[] = [
  {
    id: "midnight-drive",
    artist: "Neon Pulse",
    album: "Midnight Drive",
    year: 2023,
    color: "transparent-purple",
    trackUrl: FREE_TRACKS.lofi,
  },
  {
    id: "ocean-waves",
    artist: "Coastal Dreams",
    album: "Ocean Waves",
    year: 2021,
    color: "ocean-blue-marble",
    trackUrl: FREE_TRACKS.ambient,
  },
  {
    id: "golden-hour",
    artist: "The Sunset Collective",
    album: "Golden Hour",
    year: 2022,
    color: "gold-orange-swirl",
    trackUrl: FREE_TRACKS.chill,
  },
  {
    id: "noir",
    artist: "Shadow District",
    album: "Noir",
    year: 2020,
    color: "classic-black",
    trackUrl: FREE_TRACKS.jazz,
  },
  {
    id: "electric-dreams",
    artist: "Synthwave Masters",
    album: "Electric Dreams",
    year: 2024,
    color: "hot-pink",
    trackUrl: FREE_TRACKS.electronic,
  },
  {
    id: "forest-echo",
    artist: "Nature Sounds",
    album: "Forest Echo",
    year: 2019,
    color: "forest-green",
    trackUrl: FREE_TRACKS.ambient,
  },
  {
    id: "crimson-heart",
    artist: "The Romantics",
    album: "Crimson Heart",
    year: 2022,
    color: "blood-red",
    trackUrl: FREE_TRACKS.piano,
  },
  {
    id: "summer-haze",
    artist: "The Beach Collective",
    album: "Summer Haze",
    year: 2021,
    color: "sunset-gradient",
    trackUrl: FREE_TRACKS.acoustic,
  },
  {
    id: "arctic-silence",
    artist: "Frozen Echoes",
    album: "Arctic Silence",
    year: 2024,
    color: "ice-white",
    trackUrl: FREE_TRACKS.cinematic,
  },
  {
    id: "honey-drip",
    artist: "Mellow Groove",
    album: "Honey Drip",
    year: 2020,
    color: "amber-honey",
    trackUrl: FREE_TRACKS.lofi,
  },
  {
    id: "deep-space",
    artist: "Cosmic Voyagers",
    album: "Deep Space",
    year: 2023,
    color: "midnight-blue",
    trackUrl: FREE_TRACKS.cinematic,
  },
  {
    id: "tropical-sunrise",
    artist: "Island Breeze",
    album: "Tropical Sunrise",
    year: 2022,
    color: "coral-peach",
    trackUrl: FREE_TRACKS.chill,
  },
  {
    id: "velvet-nights",
    artist: "Luna Noir",
    album: "Velvet Nights",
    year: 2022,
    color: "classic-black",
    trackUrl: FREE_TRACKS.jazz,
  },
  {
    id: "cyber-city",
    artist: "Digital Horizon",
    album: "Cyber City 2099",
    year: 2024,
    color: "transparent-purple",
    trackUrl: FREE_TRACKS.electronic,
  },
  {
    id: "wilderness",
    artist: "Mountain Echo",
    album: "Wilderness",
    year: 2018,
    color: "forest-green",
    trackUrl: FREE_TRACKS.acoustic,
  },
  {
    id: "retro-wave",
    artist: "80s Revival",
    album: "Retro Wave",
    year: 2021,
    color: "hot-pink",
    trackUrl: FREE_TRACKS.electronic,
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

  // Vinyl crackle and music audio
  const { initAudio } = useVinylAudio({ 
    isPlaying: isPlaying && isPoweredOn, 
    volume,
    trackUrl: selectedRecord?.trackUrl,
  });

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
    
    // Initialize audio on first interaction
    initAudio();
    
    if (isPlaying) {
      setTonearmPosition("rest");
      setTimeout(() => setIsPlaying(false), 500);
    } else {
      setIsPlaying(true);
      setTimeout(() => setTonearmPosition("playing"), 100);
    }
  };

  // Handle tonearm position change (from dragging or clicking tonearm)
  const handleTonearmPositionChange = (newPosition: "rest" | "playing") => {
    if (!isPoweredOn || !selectedRecord) return;
    
    // Initialize audio on first interaction
    initAudio();
    
    setTonearmPosition(newPosition);
    if (newPosition === "playing") {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
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
            <div
              className="relative z-30"
              style={{ height: turntableHeight > 0 ? `${turntableHeight}px` : undefined }}
            >
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
            <div
              ref={turntableRef}
              className="relative z-20 w-full max-w-xl mx-auto aspect-square justify-self-center"
            >
              <Turntable
                record={selectedRecord}
                isPlaying={isPlaying && isPoweredOn}
                isPoweredOn={isPoweredOn}
                speed={speed}
                tonearmPosition={tonearmPosition}
                isSwapping={isSwapping}
                onTonearmPositionChange={handleTonearmPositionChange}
              />
            </div>

            {/* Record Collection - Right side */}
            <div
              className="relative z-10"
              style={{ height: turntableHeight > 0 ? `${turntableHeight}px` : undefined }}
            >
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
            <div className="w-full max-w-md sm:max-w-lg mx-auto">
              <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                <div className="absolute inset-0">
                  <Turntable
                    record={selectedRecord}
                    isPlaying={isPlaying && isPoweredOn}
                    isPoweredOn={isPoweredOn}
                    speed={speed}
                    tonearmPosition={tonearmPosition}
                    isSwapping={isSwapping}
                    onTonearmPositionChange={handleTonearmPositionChange}
                  />
                </div>
              </div>
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
