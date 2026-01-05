import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/i18n/LanguageContext";
import { type SeoAnalysisResult } from "@/lib/api/seoAnalyzer";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  FileText,
  Image,
  Link2,
  Smartphone,
  Zap,
  Share2,
  Code,
} from "lucide-react";

interface SeoResultsProps {
  result: SeoAnalysisResult;
  onReset: () => void;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const StatusIcon = ({ status }: { status: "pass" | "warning" | "fail" }) => {
  if (status === "pass") return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (status === "warning") return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  return <XCircle className="w-5 h-5 text-red-500" />;
};

export const SeoResults = ({ result, onReset }: SeoResultsProps) => {
  const { t } = useLanguage();

  const overallScore = result.score || 0;

  return (
    <section className="w-full py-12 pb-24">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">
                {t.seo.resultsTitle}
              </h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {result.url}
              </p>
            </div>
            <Button variant="outline" onClick={onReset} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t.seo.analyzeAnother}
            </Button>
          </div>

          {/* Overall Score */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${overallScore * 3.52} 352`}
                      className={getScoreColor(overallScore)}
                    />
                  </svg>
                  <span className={`absolute text-3xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}
                  </span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-semibold mb-2">{t.seo.overallScore}</h3>
                  <p className="text-muted-foreground">
                    {overallScore >= 80
                      ? t.seo.scoreGood
                      : overallScore >= 50
                      ? t.seo.scoreAverage
                      : t.seo.scorePoor}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meta Tags */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                {t.seo.sections.metaTags}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <StatusIcon status={result.meta?.title?.status || "fail"} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{t.seo.checks.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.meta?.title?.length || 0} {t.seo.characters}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    {result.meta?.title?.content || t.seo.notFound}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <StatusIcon status={result.meta?.description?.status || "fail"} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{t.seo.checks.description}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.meta?.description?.length || 0} {t.seo.characters}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground break-all">
                    {result.meta?.description?.content || t.seo.notFound}
                  </p>
                </div>
              </div>

              {/* Canonical */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <StatusIcon status={result.meta?.canonical?.status || "fail"} />
                <div className="flex-1">
                  <span className="font-medium">{t.seo.checks.canonical}</span>
                  <p className="text-sm text-muted-foreground break-all">
                    {result.meta?.canonical?.content || t.seo.notFound}
                  </p>
                </div>
              </div>

              {/* Viewport */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <StatusIcon status={result.meta?.viewport?.status || "fail"} />
                <div className="flex-1">
                  <span className="font-medium">{t.seo.checks.viewport}</span>
                  <p className="text-sm text-muted-foreground">
                    {result.meta?.viewport?.content || t.seo.notFound}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Headings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                {t.seo.sections.headings}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => (
                  <div key={tag} className="text-center p-4 rounded-lg bg-muted/50">
                    <span className="text-xs uppercase text-muted-foreground">{tag}</span>
                    <p className="text-2xl font-bold mt-1">
                      {result.headings?.[tag as keyof typeof result.headings] || 0}
                    </p>
                  </div>
                ))}
              </div>
              {result.headings?.h1 !== 1 && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {result.headings?.h1 === 0 ? t.seo.warnings.noH1 : t.seo.warnings.multipleH1}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                {t.seo.sections.images}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <span className="text-xs uppercase text-muted-foreground">{t.seo.checks.totalImages}</span>
                  <p className="text-2xl font-bold mt-1">{result.images?.total || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <span className="text-xs uppercase text-muted-foreground">{t.seo.checks.withAlt}</span>
                  <p className="text-2xl font-bold mt-1 text-green-500">{result.images?.withAlt || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <span className="text-xs uppercase text-muted-foreground">{t.seo.checks.withoutAlt}</span>
                  <p className="text-2xl font-bold mt-1 text-red-500">{result.images?.withoutAlt || 0}</p>
                </div>
              </div>
              {(result.images?.withoutAlt || 0) > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t.seo.warnings.missingAlt}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                {t.seo.sections.links}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <span className="text-xs uppercase text-muted-foreground">{t.seo.checks.totalLinks}</span>
                  <p className="text-2xl font-bold mt-1">{result.links?.total || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <span className="text-xs uppercase text-muted-foreground">{t.seo.checks.internal}</span>
                  <p className="text-2xl font-bold mt-1">{result.links?.internal || 0}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <span className="text-xs uppercase text-muted-foreground">{t.seo.checks.external}</span>
                  <p className="text-2xl font-bold mt-1">{result.links?.external || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Graph */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                {t.seo.sections.openGraph}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.openGraph?.image && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={result.openGraph.image}
                    alt="Open Graph preview"
                    className="w-full h-auto max-h-64 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="grid gap-3">
                {[
                  { label: "og:title", value: result.openGraph?.title },
                  { label: "og:description", value: result.openGraph?.description },
                  { label: "og:type", value: result.openGraph?.type },
                  { label: "og:image", value: result.openGraph?.image },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <StatusIcon status={item.value ? "pass" : "fail"} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{item.label}</span>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.value || t.seo.notFound}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Hints */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>
                {t.seo.sections.performance}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.performance?.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <StatusIcon status={item.status} />
                  <div className="flex-1">
                    <span className="font-medium">{item.label}</span>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>{t.seo.recommendations}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};
