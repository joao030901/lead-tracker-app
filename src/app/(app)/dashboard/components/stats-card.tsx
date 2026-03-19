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

  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300">
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
