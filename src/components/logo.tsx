import { cn } from "@/lib/utils";

interface LogoProps {
    isMinimized?: boolean;
}

export function Logo({ isMinimized = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span 
        className={cn(
          "font-headline text-3xl font-bold text-foreground transition-all duration-300",
          { "sr-only opacity-0": isMinimized }
        )}
      >
        LeadsUni
      </span>
    </div>
  );
}
