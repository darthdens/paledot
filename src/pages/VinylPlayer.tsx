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

// Royalty-free synthwave tracks (bundled locally for reliable playback)
const RETRO_TRACKS = {
  retro80s: "/audio/80s-retro-synthwave.mp3",
  catchSynth: "/audio/catch-the-synth.mp3",
  cyberpunkGuitar: "/audio/cyberpunk-guitar.mp3",
  darkMatter: "/audio/dark-matter-canon.mp3",
  digitalSunrise: "/audio/digital-sunrise.mp3",
  retroSynthPop: "/audio/retro-synth-pop.mp3",
  strangerThings: "/audio/stranger-things.mp3",
  synthWaveLife: "/audio/synth-wave-life.mp3",
  synthwaveRetro: "/audio/synthwave-retro-80s.mp3",
  synthwaveSoundscape: "/audio/synthwave-soundscape.mp3",
};

const vinylCollection: VinylRecord[] = [
  {
    id: "80s-retro-synthwave",
    artist: "Retro Vibes",
    album: "80s Retro Synthwave",
    trackName: "80s Retro Synthwave",
    year: 2023,
    color: "midnight-purple",
    trackUrl: RETRO_TRACKS.retro80s,
  },
  {
    id: "catch-the-synth",
    artist: "Synth Riders",
    album: "Catch The Synth",
    trackName: "Catch The Synth",
    year: 2022,
    color: "electric-cyan",
    trackUrl: RETRO_TRACKS.catchSynth,
  },
  {
    id: "cyberpunk-guitar",
    artist: "Neon Nights",
    album: "Cyberpunk Guitar",
    trackName: "Cyberpunk Guitar",
    year: 2024,
    color: "neon-pink",
    trackUrl: RETRO_TRACKS.cyberpunkGuitar,
  },
  {
    id: "dark-matter-canon",
    artist: "Dark Matter",
    album: "Dark Matter Canon",
    trackName: "Dark Matter Canon",
    year: 2024,
    color: "classic-black",
    trackUrl: RETRO_TRACKS.darkMatter,
  },
  {
    id: "digital-sunrise",
    artist: "Sunrise FM",
    album: "Digital Sunrise",
    trackName: "Digital Sunrise",
    year: 2023,
    color: "sunset-orange",
    trackUrl: RETRO_TRACKS.digitalSunrise,
  },
  {
    id: "retro-synth-pop",
    artist: "Pop Mechanics",
    album: "Retro Synth Pop",
    trackName: "Retro Synth Pop",
    year: 2024,
    color: "rose-gold",
    trackUrl: RETRO_TRACKS.retroSynthPop,
  },
  {
    id: "stranger-things",
    artist: "Upside Down",
    album: "Stranger Things",
    trackName: "Stranger Things",
    year: 2022,
    color: "deep-magenta",
    trackUrl: RETRO_TRACKS.strangerThings,
  },
  {
    id: "synth-wave-life",
    artist: "Retro Décadas",
    album: "Synth Wave Life",
    trackName: "Synth Wave Life",
    year: 2022,
    color: "golden-bronze",
    trackUrl: RETRO_TRACKS.synthWaveLife,
  },
  {
    id: "synthwave-retro-80s",
    artist: "Retro Runner",
    album: "Synthwave Retro 80s",
    trackName: "Synthwave Retro 80s",
    year: 2024,
    color: "chrome-silver",
    trackUrl: RETRO_TRACKS.synthwaveRetro,
  },
  {
    id: "synthwave-soundscape",
    artist: "Soundscape",
    album: "Synthwave Soundscape",
    trackName: "Synthwave Soundscape",
    year: 2024,
    color: "noir-smoke",
    trackUrl: RETRO_TRACKS.synthwaveSoundscape,
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
  const { initAudio, playMusicNow, stopMusicNow, seekBy } = useVinylAudio({ 
    isPlaying: isPlaying && isPoweredOn, 
    volume,
    trackUrl: selectedRecord?.trackUrl,
  });

  // Handle disc scrubbing (rotate vinyl to seek)
  const handleScrub = (deltaSeconds: number) => {
    seekBy(deltaSeconds);
  };

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
                onScrub={handleScrub}
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
                    onScrub={handleScrub}
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
