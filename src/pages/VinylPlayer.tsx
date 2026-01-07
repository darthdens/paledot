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

// Verified working audio URLs from Archive.org (public domain)
const RETRO_TRACKS = {
  track1: "https://ia800806.us.archive.org/15/items/Mp3Playlist_555/AaronNeville-CrazyLove.mp3",
  track2: "https://ia800605.us.archive.org/32/items/Mp3Playlist_555/Daughtry-Homeacoustic.mp3",
  track3: "https://ia800605.us.archive.org/32/items/Mp3Playlist_555/JessieJ-PriceTag.mp3",
  track4: "https://ia800605.us.archive.org/32/items/Mp3Playlist_555/ColdPlay-ParadiseInstrumental.mp3",
  track5: "https://ia800605.us.archive.org/32/items/Mp3Playlist_555/Rihanna-Diamonds.mp3",
  track6: "https://ia800605.us.archive.org/32/items/Mp3Playlist_555/PinkFloyd-HighHopes.mp3",
  track7: "https://ia800806.us.archive.org/15/items/Mp3Playlist_555/Evanescence-MyImmortal.mp3",
  track8: "https://ia800806.us.archive.org/15/items/Mp3Playlist_555/LinkinPark-InTheEnd.mp3",
};

// Drive-inspired retrowave vinyl collection (fictional artists, Drive aesthetic)
const vinylCollection: VinylRecord[] = [
  {
    id: "nightcall",
    artist: "Neon Velocity",
    album: "OutRun",
    trackName: "Nightcall",
    year: 2010,
    color: "neon-pink",
    trackUrl: RETRO_TRACKS.track1,
  },
  {
    id: "a-real-hero",
    artist: "Electric Youth",
    album: "A Real Hero",
    trackName: "A Real Hero",
    year: 2011,
    color: "chrome-silver",
    trackUrl: RETRO_TRACKS.track2,
  },
  {
    id: "turbo-killer",
    artist: "Chrome Phantom",
    album: "Trilogy",
    trackName: "Turbo Killer",
    year: 2015,
    color: "deep-magenta",
    trackUrl: RETRO_TRACKS.track3,
  },
  {
    id: "the-driver",
    artist: "Sunset Boulevard",
    album: "Drive OST",
    trackName: "The Driver",
    year: 2011,
    color: "golden-bronze",
    trackUrl: RETRO_TRACKS.track4,
  },
  {
    id: "tech-noir",
    artist: "Gunship Echo",
    album: "Neon Shadows",
    trackName: "Tech Noir",
    year: 2015,
    color: "midnight-purple",
    trackUrl: RETRO_TRACKS.track5,
  },
  {
    id: "blizzard",
    artist: "Dark Horizon",
    album: "Dangerous Days",
    trackName: "Blizzard",
    year: 2014,
    color: "electric-cyan",
    trackUrl: RETRO_TRACKS.track6,
  },
  {
    id: "sunset",
    artist: "The Midnight Sun",
    album: "Endless Summer",
    trackName: "Sunset",
    year: 2016,
    color: "sunset-orange",
    trackUrl: RETRO_TRACKS.track7,
  },
  {
    id: "resonance",
    artist: "Home Circuit",
    album: "Odyssey",
    trackName: "Resonance",
    year: 2014,
    color: "rose-gold",
    trackUrl: RETRO_TRACKS.track8,
  },
  {
    id: "accelerated",
    artist: "Miami Nights",
    album: "Turbulence",
    trackName: "Accelerated",
    year: 2012,
    color: "noir-smoke",
    trackUrl: RETRO_TRACKS.track1,
  },
  {
    id: "after-dark",
    artist: "Neon Kitty",
    album: "Time",
    trackName: "After Dark",
    year: 2014,
    color: "classic-black",
    trackUrl: RETRO_TRACKS.track2,
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
