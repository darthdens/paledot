import { supabase } from "@/integrations/supabase/client";

export interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  textPrimary?: string;
  textSecondary?: string;
  [key: string]: string | undefined;
}

export interface BrandTypography {
  fontFamilies?: {
    primary?: string;
    heading?: string;
    code?: string;
  };
  fontSizes?: {
    h1?: string;
    h2?: string;
    h3?: string;
    body?: string;
  };
  fontWeights?: {
    regular?: number;
    medium?: number;
    bold?: number;
  };
}

export interface BrandImages {
  logo?: string;
  favicon?: string;
  ogImage?: string;
}

export interface BrandComponents {
  buttonPrimary?: {
    background?: string;
    textColor?: string;
    borderRadius?: string;
  };
  buttonSecondary?: {
    background?: string;
    textColor?: string;
    borderRadius?: string;
  };
}

export interface BrandingData {
  colorScheme?: "light" | "dark";
  logo?: string;
  colors?: BrandColors;
  fonts?: Array<{ family: string }>;
  typography?: BrandTypography;
  spacing?: {
    baseUnit?: number;
    borderRadius?: string;
  };
  components?: BrandComponents;
  images?: BrandImages;
}

export interface BrandExtractionResult {
  success: boolean;
  error?: string;
  branding?: BrandingData;
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
  links?: string[];
  sourceUrl?: string;
}

export async function extractBrand(url: string): Promise<BrandExtractionResult> {
  const { data, error } = await supabase.functions.invoke("extract-brand", {
    body: { url },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}
