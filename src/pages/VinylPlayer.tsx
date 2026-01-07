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

// Royalty-free synthwave tracks (publicly accessible)
const RETRO_TRACKS = {
  retroSynth: "https://cdn.pixabay.com/audio/2024/01/18/audio_6476100913.mp3",
  neonGaming: "https://cdn.pixabay.com/audio/2022/12/11/audio_517924151b.mp3",
  vintageFuture: "https://cdn.pixabay.com/audio/2022/02/07/audio_412e62496d.mp3",
  strangerVibes: "https://cdn.pixabay.com/audio/2022/10/24/audio_349d479361.mp3",
  synthCity: "https://cdn.pixabay.com/audio/2022/03/10/audio_b5e420b320.mp3",
  darkwave: "https://cdn.pixabay.com/audio/2022/05/16/audio_a69e540a06.mp3",
  midnightRun: "https://cdn.pixabay.com/audio/2023/03/23/audio_3758c71c48.mp3",
  neonDreams: "https://cdn.pixabay.com/audio/2022/11/22/audio_4e4bc72d26.mp3",
};

// Drive-inspired retrowave vinyl collection (fictional artists, real vibes)
const vinylCollection: VinylRecord[] = [
  {
    id: "nightcall",
    artist: "Neon Velocity",
    album: "OutRun",
    trackName: "Nightcall",
    year: 2010,
    color: "neon-pink",
    trackUrl: RETRO_TRACKS.retroSynth,
  },
  {
    id: "a-real-hero",
    artist: "Electric Youth",
    album: "A Real Hero",
    trackName: "A Real Hero",
    year: 2011,
    color: "chrome-silver",
    trackUrl: RETRO_TRACKS.vintageFuture,
  },
  {
    id: "turbo-killer",
    artist: "Chrome Phantom",
    album: "Trilogy",
    trackName: "Turbo Killer",
    year: 2015,
    color: "deep-magenta",
    trackUrl: RETRO_TRACKS.darkwave,
  },
  {
    id: "the-driver",
    artist: "Sunset Boulevard",
    album: "Drive OST",
    trackName: "The Driver",
    year: 2011,
    color: "golden-bronze",
    trackUrl: RETRO_TRACKS.neonDreams,
  },
  {
    id: "tech-noir",
    artist: "Gunship Echo",
    album: "Neon Shadows",
    trackName: "Tech Noir",
    year: 2015,
    color: "midnight-purple",
    trackUrl: RETRO_TRACKS.strangerVibes,
  },
  {
    id: "blizzard",
    artist: "Dark Horizon",
    album: "Dangerous Days",
    trackName: "Blizzard",
    year: 2014,
    color: "electric-cyan",
    trackUrl: RETRO_TRACKS.synthCity,
  },
  {
    id: "sunset",
    artist: "The Midnight Sun",
    album: "Endless Summer",
    trackName: "Sunset",
    year: 2016,
    color: "sunset-orange",
    trackUrl: RETRO_TRACKS.neonGaming,
  },
  {
    id: "resonance",
    artist: "Home Circuit",
    album: "Odyssey",
    trackName: "Resonance",
    year: 2014,
    color: "rose-gold",
    trackUrl: RETRO_TRACKS.midnightRun,
  },
  {
    id: "accelerated",
    artist: "Miami Nights",
    album: "Turbulence",
    trackName: "Accelerated",
    year: 2012,
    color: "neon-pink",
    trackUrl: RETRO_TRACKS.retroSynth,
  },
  {
    id: "thriller",
    artist: "Lazerhawk",
    album: "Redline",
    trackName: "King of the Streets",
    year: 2010,
    color: "noir-smoke",
    trackUrl: RETRO_TRACKS.darkwave,
  },
  {
    id: "after-dark",
    artist: "Neon Kitty",
    album: "Time",
    trackName: "After Dark",
    year: 2014,
    color: "classic-black",
    trackUrl: RETRO_TRACKS.strangerVibes,
  },
  {
    id: "crystals",
    artist: "M.O.O.N.",
    album: "Hotline Miami",
    trackName: "Crystals",
    year: 2012,
    color: "electric-cyan",
    trackUrl: RETRO_TRACKS.synthCity,
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
