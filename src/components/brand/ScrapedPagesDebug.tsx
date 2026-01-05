import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

interface ScrapedPagesDebugProps {
  scrapedUrls?: string[];
}

export const ScrapedPagesDebug = ({ scrapedUrls }: ScrapedPagesDebugProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (!scrapedUrls || scrapedUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
        {t.brandKit.scrapedPages} ({scrapedUrls.length})
      </button>

      {isOpen && (
        <ul className="space-y-1 pl-6 text-xs text-muted-foreground">
          {scrapedUrls.map((url, idx) => (
            <li key={idx} className="flex items-center gap-1 truncate">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors truncate max-w-md"
              >
                {url}
              </a>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
