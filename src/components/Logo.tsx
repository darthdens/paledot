import logoImage from "@/assets/logo.webp";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "w-8 h-8" }: LogoProps) => {
  return (
    <img
      src={logoImage}
      alt="Dens Akoka Logo"
      className={`${className} dark:invert object-contain aspect-square`}
    />
  );
};
