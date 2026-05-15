import { cn } from "@/lib/utils";

interface LogoProps {
    isMinimized?: boolean;
}

export function Logo({ isMinimized = false }: LogoProps) {
  return (
    <div className={cn(
      "flex items-center transition-all duration-500 group",
      isMinimized ? "justify-center w-full px-0" : "gap-3 px-1"
    )}>
      <div className="relative shrink-0 scale-95 sm:scale-100">
        {/* Static Premium Glow */}
        <div className="absolute -inset-2 bg-gradient-to-tr from-primary/30 via-emerald-400/20 to-blue-500/30 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition duration-700" />
        
        {/* Main Logo Container */}
        <div className="relative h-10 w-10 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-xl flex items-center justify-center shadow-2xl group-hover:border-primary/50 transition-all duration-500">
            {/* Interior Glass Shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 transition-transform duration-500 group-hover:scale-110"
            >
                <defs>
                    <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
                <path 
                    d="M22 10L12 5L2 10L12 15L22 10Z" 
                    fill="url(#logo-grad)" 
                    fillOpacity="0.3"
                    stroke="url(#logo-grad)" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                <path 
                    d="M6 12.5V16.5C6 16.5 8 19 12 19C16 19 18 16.5 18 16.5V12.5" 
                    stroke="url(#logo-grad)" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                <path 
                    d="M22 10V16" 
                    stroke="url(#logo-grad)" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
                <path 
                    d="M12 11V14" 
                    stroke="#fff" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    className="opacity-80"
                />
                <circle cx="12" cy="10" r="1" fill="#fff" />
            </svg>
        </div>
      </div>
      
      <div className={cn(
        "flex flex-col transition-all duration-500",
        isMinimized ? "w-0 opacity-0 scale-90" : "w-auto opacity-100 scale-100"
      )}>
        <span className="font-headline text-xl font-black tracking-tight text-foreground leading-none">
            Leads<span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">Uni</span>
        </span>
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-0.5">
            Edu Management
        </span>
      </div>
    </div>
  );
}
