interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "w-8 h-8" }: LogoProps) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer arch */}
      <path
        d="M15 95V45C15 22.909 32.909 5 55 5C77.091 5 95 22.909 95 45V95H80V45C80 31.193 68.807 20 55 20C41.193 20 30 31.193 30 45V95H15Z"
        fill="currentColor"
      />
      {/* Inner A shape */}
      <path
        d="M55 35L75 95H60L55 80L50 95H35L55 35Z"
        fill="currentColor"
      />
      {/* Cutout in A */}
      <path
        d="M55 55L60 70H50L55 55Z"
        fill="hsl(var(--background))"
      />
    </svg>
  );
};
