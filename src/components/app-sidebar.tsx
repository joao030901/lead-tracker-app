'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarCheck,
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  Building,
  Moon,
  Sun,
  ChevronLeft,
  Bell,
  CheckCircle,
  Contact,
  GraduationCap,
  Search,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useLocation } from '@/context/location-context';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useAgenda } from '@/context/agenda-context';
import { useMemo, useState, useEffect } from 'react';
import { parse, isToday } from 'date-fns';
import { AgendaTask } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { listLocations } from '@/lib/actions';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/leads',
    label: 'Leads',
    icon: Contact,
  },
  {
    href: '/candidates',
    label: 'Candidatos',
    icon: Users,
  },
   {
    href: '/students',
    label: 'Alunos',
    icon: GraduationCap,
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: CalendarCheck,
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: Settings,
  },
];


export function NotificationBell() {
    const { tasks } = useAgenda();
    const router = useRouter();

    const todaysTasks = useMemo(() => {
        return tasks
          .filter(task => {
            if (task.completed) return false;
            try {
                const taskDate = parse(task.date, 'yyyy-MM-dd', new Date());
                return isToday(taskDate);
            } catch {
                return false;
            }
          })
          .sort((a,b) => a.time.localeCompare(b.time));
    }, [tasks]);
    
    const hasTasksToday = useMemo(() => {
        return todaysTasks.length > 0;
    }, [todaysTasks]);

    const handleTaskClick = (task: AgendaTask) => {
        if(task.candidateId) {
            router.push(`/candidates/${task.candidateId}`);
        } else {
            router.push('/agenda');
        }
    }

    return (
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {hasTasksToday && <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
                <div className="bg-primary p-4 text-primary-foreground">
                    <h4 className="font-bold leading-none">Notificações</h4>
                    <p className="text-xs opacity-80 mt-1">Atividades pendentes para hoje</p>
                </div>
                <ScrollArea className="max-h-[350px]">
                    <div className="grid p-2">
                        {todaysTasks.length > 0 ? (
                            todaysTasks.map(task => (
                                <div 
                                    key={task.id} 
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors" 
                                    onClick={() => handleTaskClick(task)}
                                >
                                    <span className="flex h-2 w-2 translate-y-1.5 rounded-full bg-primary shrink-0" />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold truncate leading-tight">
                                            {task.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {task.time}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="bg-muted rounded-full p-3 mb-3 text-muted-foreground">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium">Tudo em dia!</p>
                                <p className="text-xs text-muted-foreground mt-1">Nenhuma tarefa pendente para hoje.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}


export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { location, setLocation, clearLocation } = useLocation();
  const { theme, setTheme } = useTheme();
  const { open, setOpen, isMobile } = useSidebar();
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locs = await listLocations();
        setAvailableLocations(locs);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    fetchLocations();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearLocation();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  
  const formatLocationName = (name: string | null) => {
    if (!name) return 'N/A';
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  const locationName = formatLocationName(location);

  const handleToggleTheme = () => {
      setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleToggleSidebar = () => setOpen(!open);

  const filteredLocations = availableLocations.filter(loc => 
    loc.replace(/_/g, ' ').toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleLocationSwitch = (newLoc: string) => {
    setLocation(newLoc);
    window.location.reload(); // Reload to ensure all context providers reset cleanly
  };

  return (
    <Sidebar className="border-r-0 shadow-xl">
        <div className="flex flex-col h-full bg-card/90 dark:bg-zinc-950/90 backdrop-blur-xl">
            <SidebarHeader className="border-b bg-primary/5">
                <div className="flex items-center justify-between w-full">
                    <Logo isMinimized={!open && !isMobile} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-muted-foreground hover:text-primary hidden md:flex transition-transform duration-300", { "rotate-180": !open})}
                        onClick={handleToggleSidebar}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent className="py-4">
                <SidebarMenu className="px-2">
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={item.href} className='w-full'>
                                    <SidebarMenuButton
                                        size="lg"
                                        isActive={pathname.startsWith(item.href)}
                                        isMinimized={!open && !isMobile}
                                        className={cn(
                                            "transition-all duration-200 h-14",
                                            pathname.startsWith(item.href) 
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                                : "hover:bg-primary/10 hover:text-primary"
                                        )}
                                    >
                                        <item.icon className={cn("shrink-0 transition-all duration-200", (!open && !isMobile) ? "h-7 w-7" : "h-6 w-6", pathname.startsWith(item.href) ? "" : "text-primary")} />
                                        <span className="font-medium text-base">{item.label}</span>
                                    </SidebarMenuButton>
                                </Link>
                            </TooltipTrigger>
                            {(!open || isMobile) && <TooltipContent side="right" className="font-semibold">{item.label}</TooltipContent>}
                        </Tooltip>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t bg-muted/30">
                 <div className={cn("flex items-center justify-between p-2", (!open && !isMobile) && 'flex-col gap-2')}>
                    <div className={cn("flex items-center gap-1", (!open && !isMobile) ? 'flex-col' : 'flex-row')}>
                        <Popover>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                            <Building className="h-5 w-5"/>
                                        </Button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="right">Trocar Unidade ({locationName})</TooltipContent>
                            </Tooltip>
                            <PopoverContent side={(!open && !isMobile) ? "right" : "top"} align="start" className="w-64 p-0">
                                <div className="p-3 border-b bg-muted/20">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Alternar Unidade</h4>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input 
                                            placeholder="Buscar unidade..." 
                                            className="h-8 pl-8 text-xs" 
                                            value={locationSearch}
                                            onChange={(e) => setLocationSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <ScrollArea className="h-full max-h-64">
                                    <div className="p-1">
                                        {filteredLocations.map((loc) => (
                                            <Button
                                                key={loc}
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start text-xs h-9 mb-0.5",
                                                    location === loc ? "bg-primary/10 text-primary font-bold" : "font-medium"
                                                )}
                                                onClick={() => handleLocationSwitch(loc)}
                                            >
                                                <Building className={cn("mr-2 h-3.5 w-3.5", location === loc ? "text-primary" : "text-muted-foreground")} />
                                                {formatLocationName(loc)}
                                                {location === loc && <CheckCircle className="ml-auto h-3.5 w-3.5" />}
                                            </Button>
                                        ))}
                                        {filteredLocations.length === 0 && (
                                            <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma unidade encontrada</div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={handleToggleTheme}>
                                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Alternar Tema</TooltipContent>
                        </Tooltip>
                        {!isMobile && (
                            <NotificationBell />
                        )}
                    </div>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size={(!open && !isMobile) ? 'icon' : 'sm'} 
                                className="text-muted-foreground hover:text-destructive transition-colors" 
                                onClick={handleLogout}
                            >
                                <LogOut className="h-5 w-5"/>
                                {(open && !isMobile) && <span className="ml-2 font-semibold">Sair</span>}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Sair do Sistema</TooltipContent>
                    </Tooltip>
                </div>
            </SidebarFooter>
        </div>
    </Sidebar>
  );
}
