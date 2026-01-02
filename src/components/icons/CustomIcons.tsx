// Custom icon components with a unique, hand-crafted aesthetic
// These abstract shapes create a distinctive visual language

interface IconProps {
  className?: string;
}

export const IconLocation = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="10" r="3" />
    <path d="M12 2C8 2 5 5.5 5 9.5C5 14 12 22 12 22C12 22 19 14 19 9.5C19 5.5 16 2 12 2Z" />
  </svg>
);

export const IconArrowDown = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 4V20M12 20L6 14M12 20L18 14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconMenu = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M4 8H20M4 16H20" strokeLinecap="round" />
  </svg>
);

export const IconClose = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M6 6L18 18M18 6L6 18" strokeLinecap="round" />
  </svg>
);

export const IconSun = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" strokeLinecap="round" />
  </svg>
);

export const IconMoon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

export const IconTrophy = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 15C15 15 17 12 17 8V4H7V8C7 12 9 15 12 15Z" />
    <path d="M17 6H19C20 6 21 7 21 8C21 10 19 12 17 12" />
    <path d="M7 6H5C4 6 3 7 3 8C3 10 5 12 7 12" />
    <path d="M12 15V18" />
    <path d="M8 21H16" strokeLinecap="round" />
    <path d="M10 18H14V21H10V18Z" />
  </svg>
);

export const IconExternal = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M10 6H6C5 6 4 7 4 8V18C4 19 5 20 6 20H16C17 20 18 19 18 18V14" strokeLinecap="round" />
    <path d="M14 4H20V10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4L10 14" strokeLinecap="round" />
  </svg>
);

// Service icons - abstract, geometric shapes
export const IconWeb = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9H21" />
    <circle cx="6" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="11" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

export const IconBrand = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3C12 3 8 8 8 12C8 16 12 21 12 21" />
    <path d="M12 3C12 3 16 8 16 12C16 16 12 21 12 21" />
    <path d="M3 12H21" />
  </svg>
);

export const IconMegaphone = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M19 5L19 19" strokeLinecap="round" />
    <path d="M19 5C19 5 15 7 10 7H6C4.5 7 3 8.5 3 10V14C3 15.5 4.5 17 6 17H7L8 21H11L10 17C15 17 19 19 19 19" />
  </svg>
);

export const IconLayers = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 4L3 9L12 14L21 9L12 4Z" />
    <path d="M3 14L12 19L21 14" />
  </svg>
);

export const IconHandshake = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M7 11L3 15L7 19" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 11L21 15L17 19" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 5L10 5" strokeLinecap="round" />
    <path d="M3 15H9L12 12L15 15H21" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconAI = ({ className = "w-6 h-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2V5M12 19V22M2 12H5M19 12H22" strokeLinecap="round" />
    <path d="M5.64 5.64L7.76 7.76M16.24 16.24L18.36 18.36M5.64 18.36L7.76 16.24M16.24 7.76L18.36 5.64" strokeLinecap="round" />
  </svg>
);

export const IconClock = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7V12L15 15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconArrowUpRight = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M7 17L17 7M17 7H9M17 7V15" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconMail = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7L12 13L21 7" />
  </svg>
);

export const IconCalendar = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10H21" />
    <path d="M8 3V6M16 3V6" strokeLinecap="round" />
  </svg>
);

export const IconSend = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconLinkedIn = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 11V16M8 8V8.01" strokeLinecap="round" />
    <path d="M12 16V13C12 11.5 13 11 14 11C15 11 16 11.5 16 13V16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconGitHub = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 18C9 16 9 14 9 13C9 12 8 11 7 11" strokeLinecap="round" />
    <path d="M15 18C15 16 15 14 15 13C15 12 16 11 17 11" strokeLinecap="round" />
    <ellipse cx="12" cy="10" rx="4" ry="3" />
  </svg>
);

export const IconTwitter = ({ className = "w-5 h-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M4 4L10.5 12.5M20 20L13.5 11.5M10.5 12.5L4 20H8L13.5 11.5M10.5 12.5L16 4H20L13.5 11.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconSparkle = ({ className = "w-4 h-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" strokeLinejoin="round" />
    <path d="M19 15L19.5 17.5L22 18L19.5 18.5L19 21L18.5 18.5L16 18L18.5 17.5L19 15Z" strokeLinejoin="round" />
  </svg>
);
