import { cn } from "@/lib/utils";

interface LogoProps {
    isMinimized?: boolean;
}

export function Logo({ isMinimized = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3 overflow-hidden group">
      <div className="relative shrink-0">
        <div className="absolute -inset-1 bg-gradient-to-tr from-primary via-blue-500 to-emerald-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500" />
        <div className="relative h-10 w-10 bg-card border border-primary/20 rounded-lg flex items-center justify-center shadow-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            <path d="M12 11v4" className="text-emerald-500" />
            <path d="m9 13 3 2 3-2" className="text-emerald-500" />
          </svg>
        </div>
      </div>
      <span 
        className={cn(
          "font-headline text-2xl font-bold tracking-tight text-foreground transition-all duration-300 whitespace-nowrap",
          { "sr-only opacity-0 w-0": isMinimized }
        )}
      >
        Leads<span className="text-primary">Uni</span>
      </span>
    </div>
  );
}
