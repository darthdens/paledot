import { useLanguage } from "@/i18n/LanguageContext";
import { VinylRecord } from "./types";

interface RecordCollectionProps {
  records: VinylRecord[];
  selectedRecord: VinylRecord | null;
  onSelectRecord: (record: VinylRecord) => void;
}

// Mini vinyl preview colors
const getVinylPreviewColor = (color: VinylRecord["color"]): string => {
  switch (color) {
    case "classic-black":
      return "bg-gradient-to-br from-neutral-800 to-neutral-900";
    case "transparent-purple":
      return "bg-gradient-to-br from-purple-600/80 to-purple-900/80";
    case "ocean-blue-marble":
      return "bg-gradient-to-br from-cyan-500 to-blue-700";
    case "gold-orange-swirl":
      return "bg-gradient-to-br from-amber-400 to-orange-600";
    case "hot-pink":
      return "bg-gradient-to-br from-pink-500 to-pink-700";
    case "forest-green":
      return "bg-gradient-to-br from-emerald-600/80 to-green-800/80";
    case "blood-red":
      return "bg-gradient-to-br from-red-700 to-red-900";
    case "sunset-gradient":
      return "bg-gradient-to-br from-pink-500 via-orange-500 to-yellow-400";
    case "ice-white":
      return "bg-gradient-to-br from-slate-100 to-slate-300";
    case "amber-honey":
      return "bg-gradient-to-br from-amber-500 to-amber-700";
    case "midnight-blue":
      return "bg-gradient-to-br from-indigo-800 to-indigo-950";
    case "coral-peach":
      return "bg-gradient-to-br from-orange-300 to-rose-400";
    default:
      return "bg-gradient-to-br from-neutral-800 to-neutral-900";
  }
};

export const RecordCollection = ({
  records,
  selectedRecord,
  onSelectRecord,
}: RecordCollectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 h-full flex flex-col">
      <h3 className="font-medium text-foreground mb-4 flex-shrink-0">{t.vinylPlayer.collection}</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {records.map((record) => {
          const isSelected = selectedRecord?.id === record.id;
          
          return (
            <button
              key={record.id}
              onClick={() => onSelectRecord(record)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left ${
                isSelected
                  ? "bg-secondary/50 border border-border"
                  : "hover:bg-muted/50 border border-transparent"
              }`}
            >
              {/* Mini vinyl preview */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <div
                  className={`absolute inset-0 rounded-full ${getVinylPreviewColor(record.color)} shadow-md`}
                >
                  {/* Center label */}
                  <div className="absolute inset-[30%] rounded-full bg-card/80" />
                  {/* Center hole */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-secondary" />
                  {/* Grooves */}
                  <div className="absolute inset-[15%] rounded-full border border-foreground/10" />
                </div>
              </div>

              {/* Album info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {record.album}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {record.artist} · {record.year}
                </p>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-foreground/60 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
