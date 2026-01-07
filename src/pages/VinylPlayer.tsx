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

// CC0 / Public Domain synthwave tracks (bundled locally for reliable playback)
const RETRO_TRACKS = {
  purpleNight: "/audio/purple-night.mp3",
  nightDrive: "/audio/night-drive.mp3",
  outrun: "/audio/outrun.mp3",
  neonHalo: "/audio/neon-halo.mp3",
  theViceCity: "/audio/the-vice-city.mp3",
  midnightCity: "/audio/midnight-city.mp3",
  synthwaveDreams: "/audio/synthwave-dreams.mp3",
  neonLights: "/audio/neon-lights.mp3",
  driveNight: "/audio/drive-night.mp3",
  cyberpunk: "/audio/cyberpunk.mp3",
};

const vinylCollection: VinylRecord[] = [
  {
    id: "purple-night",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 1",
    trackName: "Purple Night",
    year: 2019,
    color: "midnight-purple",
    trackUrl: RETRO_TRACKS.purpleNight,
  },
  {
    id: "night-drive",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 1",
    trackName: "Night Drive",
    year: 2019,
    color: "noir-smoke",
    trackUrl: RETRO_TRACKS.nightDrive,
  },
  {
    id: "outrun",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 1",
    trackName: "Outrun",
    year: 2019,
    color: "golden-bronze",
    trackUrl: RETRO_TRACKS.outrun,
  },
  {
    id: "neon-halo",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 1",
    trackName: "Neon Halo",
    year: 2019,
    color: "electric-cyan",
    trackUrl: RETRO_TRACKS.neonHalo,
  },
  {
    id: "the-vice-city",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 1",
    trackName: "The Vice City",
    year: 2019,
    color: "chrome-silver",
    trackUrl: RETRO_TRACKS.theViceCity,
  },
  {
    id: "midnight-city",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 9",
    trackName: "Midnight City",
    year: 2019,
    color: "classic-black",
    trackUrl: RETRO_TRACKS.midnightCity,
  },
  {
    id: "synthwave-dreams",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 9",
    trackName: "Synthwave Dreams",
    year: 2019,
    color: "rose-gold",
    trackUrl: RETRO_TRACKS.synthwaveDreams,
  },
  {
    id: "neon-lights",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 9",
    trackName: "Neon Lights",
    year: 2019,
    color: "neon-pink",
    trackUrl: RETRO_TRACKS.neonLights,
  },
  {
    id: "drive-night",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 9",
    trackName: "Drive Night (Original Mix)",
    year: 2019,
    color: "sunset-orange",
    trackUrl: RETRO_TRACKS.driveNight,
  },
  {
    id: "cyberpunk",
    artist: "Synthwave Dreams",
    album: "Synthwave Dreams Vol. 9",
    trackName: "Cyberpunk",
    year: 2019,
    color: "deep-magenta",
    trackUrl: RETRO_TRACKS.cyberpunk,
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
  const { initAudio, playMusicNow, stopMusicNow } = useVinylAudio({ 
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

    // Start/stop audio inside the user gesture to avoid autoplay blocking
    initAudio();

    if (isPlaying) {
      stopMusicNow();
      setTonearmPosition("rest");
      setTimeout(() => setIsPlaying(false), 500);
    } else {
      playMusicNow();
      setIsPlaying(true);
      setTimeout(() => setTonearmPosition("playing"), 100);
    }
  };

  // Handle tonearm position change (from dragging or clicking tonearm)
  const handleTonearmPositionChange = (newPosition: "rest" | "playing") => {
    if (!isPoweredOn || !selectedRecord) return;

    // Start/stop audio inside the user gesture to avoid autoplay blocking
    initAudio();

    setTonearmPosition(newPosition);
    if (newPosition === "playing") {
      playMusicNow();
      setIsPlaying(true);
    } else {
      stopMusicNow();
      setIsPlaying(false);
    }
  };

  // Handle power toggle
  const handlePowerToggle = () => {
    if (isPoweredOn) {
      stopMusicNow();
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
      stopMusicNow();
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
