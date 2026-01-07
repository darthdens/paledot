import { useLanguage } from "@/i18n/LanguageContext";
import { VinylRecord } from "./types";
import { getVinylGradient } from "./vinylGradients";

interface RecordCollectionProps {
  records: VinylRecord[];
  selectedRecord: VinylRecord | null;
  onSelectRecord: (record: VinylRecord) => void;
}


export const RecordCollection = ({
  records,
  selectedRecord,
  onSelectRecord,
}: RecordCollectionProps) => {
  const { t } = useLanguage();

  return (
    <div className="relative z-0 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 p-4 h-full flex flex-col">
      <h3 className="font-medium text-foreground mb-4 flex-shrink-0 px-2">{t.vinylPlayer.collection}</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2 px-2">
        {records.map((record) => {
          const isSelected = selectedRecord?.id === record.id;
          
          return (
            <button
              key={record.id}
              onClick={() => onSelectRecord(record)}
              className={`w-full flex items-center gap-3 p-2 pr-3 rounded-lg transition-all duration-200 text-left ${
                isSelected
                  ? "bg-secondary/50 border border-border"
                  : "hover:bg-muted/50 border border-transparent"
              }`}
            >
              {/* Mini vinyl preview */}
              <div className="relative w-10 h-10 flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-full shadow-md"
                  style={{ background: getVinylGradient(record.color) }}
                >
                  {/* Center label */}
                  <div className="absolute inset-[30%] rounded-full bg-card/80" />
                  {/* Center hole */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-secondary" />
                  {/* Grooves */}
                  <div className="absolute inset-[15%] rounded-full border border-foreground/10" />
                </div>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {record.trackName || record.album}
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
