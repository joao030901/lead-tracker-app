import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  color?: "emerald" | "indigo" | "amber" | "rose" | "sky";
}

export function StatsCard({ title, value, icon: Icon, description, color = "emerald" }: StatsCardProps) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };

  const borderHolo = {
    emerald: "hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
    indigo: "hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]",
    amber: "hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    rose: "hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(225,29,72,0.1)]",
    sky: "hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)]",
  };

  return (
    <Card className={cn(
        "overflow-hidden border border-border/50 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-500 hover:-translate-y-1 relative group cursor-default z-10",
        borderHolo[color]
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", colors[color])}>
            <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-extrabold font-headline tracking-tight">{value}</div>
        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 font-medium">{description}</p>
      </CardContent>
    </Card>
  );
}
