
'use client';

import React, { useState, useMemo, useRef, Suspense } from 'react';
import { RowSelectionState, Row } from '@tanstack/react-table';
import Papa from 'papaparse';
import { getColumns } from './components/columns';
import { DataTable } from './components/data-table';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  Filter,
  User,
  MessageSquare,
  Copy,
  Mail,
  CheckSquare,
  FilterX,
  ChevronDown,
  Calendar,
  BadgeCheck,
  Briefcase,
  Loader2,
  XCircle,
  Book,
  MapPin,
  Phone,
  LogIn,
  Target,
  Contact,
  Fingerprint,
  Cake
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Candidate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useCandidates } from '@/context/candidates-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
  } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTemplates } from '@/context/templates-context';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useAuditLog } from '@/context/audit-log-context';
import { cn, fillTemplate, formatPhoneNumberForWhatsApp, formatDateDisplay, safeParseDate, formatCPF } from '@/lib/utils';
import { useSpecialists } from '@/context/specialists-context';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { isValid, parseISO, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ScheduleReminderCard from './[id]/components/schedule-reminder-card';
import FollowUpHistoryCard from './[id]/components/follow-up-history';

const statusTranslations: { [key: string]: string } = {
  'Registered': 'Inscrito',
  'Contacted': 'Contatado',
  'Enrolled': 'Matriculado',
  'Engaged': 'Engajado',
  'Canceled': 'Cancelado',
};

const LoadingComponent = () => (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

function CandidatePreviewContent({
  candidate,
  handleCopy,
}: {
  candidate: Candidate;
  handleCopy: (text: string, subject: string) => void;
}) {
  const { templates } = useTemplates();

  const handleTemplateClick = (templateContent: string) => {
    const message = fillTemplate(templateContent, candidate);
    const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(
      candidate.phone
    )}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleManualMessage = () => {
    const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(candidate.phone)}`;
    window.open(whatsappUrl, '_blank');
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    variant = "default",
    color = "primary"
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
    variant?: "default" | "success" | "warning";
    color?: "primary" | "amber" | "indigo" | "rose" | "emerald";
  }) => {
    if (!value) return null;
    
    const iconColors = {
        primary: "text-primary",
        amber: "text-amber-500",
        indigo: "text-indigo-500",
        rose: "text-rose-500",
        emerald: "text-emerald-500"
    };

    return (
      <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Icon className={cn("h-3 w-3", iconColors[color as keyof typeof iconColors])} />
            {label}
        </div>
        <div className={cn("font-semibold flex items-center justify-between text-sm leading-tight", 
            variant === "success" && "text-emerald-600",
            variant === "warning" && "text-amber-600"
        )}>
            <span className="truncate pr-2">{value}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-background shrink-0"
              onClick={() => handleCopy(value, label)}
            >
              <Copy className="h-3 w-3" />
            </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
        <div className="flex flex-col items-center text-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="bg-primary/10 p-3 rounded-full mb-3 text-primary">
                <User className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold font-headline leading-tight">{candidate.name}</h2>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
                <Badge 
                    variant={candidate.status === 'Canceled' ? 'destructive' : candidate.enrollmentDate ? 'default' : 'outline'}
                    className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider"
                >
                    {statusTranslations[candidate.status] || candidate.status}
                </Badge>
                
                <div className="flex items-center h-7 gap-1.5 bg-primary/10 text-primary px-2.5 rounded-full border border-primary/20 text-[9px] font-bold font-mono group transition-all hover:bg-primary/20">
                    <span className="opacity-70">{['Enrolled', 'Engaged', 'Canceled'].includes(candidate.status) ? 'MATR:' : 'CÓD:'}</span>
                    <span className="text-xs tracking-wider font-bold">
                        {(['Enrolled', 'Engaged', 'Canceled'].includes(candidate.status) && candidate.enrollmentCode) 
                            ? candidate.enrollmentCode 
                            : candidate.registrationCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-0.5 opacity-40 group-hover:opacity-100 transition-opacity hover:bg-transparent"
                      onClick={() => handleCopy((['Enrolled', 'Engaged', 'Canceled'].includes(candidate.status) && candidate.enrollmentCode) ? candidate.enrollmentCode : candidate.registrationCode, (['Enrolled', 'Engaged', 'Canceled'].includes(candidate.status)) ? 'MATR' : 'CÓD')}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
            <InfoItem icon={Book} label="Curso" value={candidate.course} color="indigo" />
            
            <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <Phone className="h-3 w-3 text-emerald-500" />
                    Telefone
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{candidate.phone}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(candidate.phone, 'Telefone')}>
                            <Copy className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="text-xs">Modelos WhatsApp</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {templates.map((template) => (
                                    <DropdownMenuItem key={template.id} onClick={() => handleTemplateClick(template.content)} className="text-xs">
                                        {template.name}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleManualMessage} className="text-xs font-semibold">Mensagem Manual</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <InfoItem icon={Mail} label="Email" value={candidate.email} color="rose" />
            <InfoItem icon={Fingerprint} label="CPF" value={formatCPF(candidate.cpf) || 'Não informado'} />
            <InfoItem icon={Cake} label="Data de Nascimento" value={formatDateDisplay(candidate.birthDate)} color="amber" />
            <InfoItem icon={MapPin} label="Cidade" value={candidate.city} color="amber" />

            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Calendar} label="Inscrição" value={formatDateDisplay(candidate.registrationDate)} color="indigo" />
                {candidate.enrollmentDate && (
                    <InfoItem icon={BadgeCheck} label="Matrícula" value={formatDateDisplay(candidate.enrollmentDate)} variant="success" color="emerald" />
                )}
            </div>

            {candidate.firstPaymentPaid && candidate.paymentDate && (
                <InfoItem icon={BadgeCheck} label="Primeira Mensalidade" value={`Paga em ${formatDateDisplay(candidate.paymentDate)}`} variant="success" color="emerald" />
            )}

            <InfoItem icon={LogIn} label="Forma de Ingresso" value={candidate.entryMethod} color="amber" />

            <div className="grid grid-cols-1 gap-2 pt-2 border-t">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Especialistas Responsáveis</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 p-2 rounded-lg border">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Matrícula</p>
                        <p className="text-xs font-semibold truncate mt-0.5">{candidate.specialist || '-'}</p>
                    </div>
                    <div className="bg-muted/30 p-2 rounded-lg border">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Inscrição</p>
                        <p className="text-xs font-semibold truncate mt-0.5">{candidate.registrationLoginName || '-'}</p>
                    </div>
                </div>
            </div>
        </div>

        <ScheduleReminderCard candidate={candidate} />
        <FollowUpHistoryCard candidate={candidate} />
    </div>
  );
}

function CandidatesPageContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { candidates, setCandidates, selectedId, setSelectedId, filters, setFilters } = useCandidates();
  const { specialists } = useSpecialists();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [identifierSource, setIdentifierSource] = useState<'id' | 'manual'>('id');
  const [exportFormat, setExportFormat] = useState('google');

  const selectedCandidate = useMemo(() => candidates.find(c => c.id === selectedId), [candidates, selectedId]);

  const availableCourses = useMemo(() => [...new Set(candidates.map((c) => c.course))].sort(), [candidates]);
  const availableCities = useMemo(() => [...new Set(candidates.map((c) => c.city).filter(Boolean) as string[])].sort(), [candidates]);
  const availableSpecialists = useMemo(() => [...new Set(specialists.map(s => s.name))].sort(), [specialists]);
  
  const availableStatuses = useMemo(() => Object.keys(statusTranslations), []);

  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.status?.length || filters.course?.length || filters.regSpec?.length || filters.enrSpec?.length || filters.city?.length || filters.payment !== 'all' || filters.regDate?.from || filters.enrDate?.from);
  }, [filters]);

  const handleCopy = (text: string, subject: string) => {
    navigator.clipboard.writeText(text).then(() => { toast({ title: `${subject} copiado!` }); });
  };

  const handleRowClick = (row: Row<Candidate>) => {
    setSelectedId(row.original.id);
    if (window.innerWidth < 1280) {
        setIsSheetOpen(true);
    }
  };

  const columns = React.useMemo(() => getColumns(handleCopy), []);

  const filteredCandidates = useMemo(() => {
    let filtered = candidates;
    if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(query) || c.registrationCode.toLowerCase().includes(query));
    }
    if (filters.status?.length > 0) filtered = filtered.filter((c) => filters.status.includes(c.status));
    if (filters.course?.length > 0) filtered = filtered.filter((c) => filters.course.includes(c.course));
    if (filters.enrSpec?.length > 0) filtered = filtered.filter((c) => c.specialist && filters.enrSpec.includes(c.specialist));
    if (filters.regSpec?.length > 0) filtered = filtered.filter((c) => c.registrationLoginName && filters.regSpec.includes(c.registrationLoginName));
    if (filters.city?.length > 0) filtered = filtered.filter((c) => filters.city.includes(c.city));
    if (filters.payment !== 'all') filtered = filtered.filter((c) => c.firstPaymentPaid === (filters.payment === 'paid'));
    
    if (filters.regDate?.from && filters.regDate?.to) {
        filtered = filtered.filter((c) => {
            try {
                const regDate = safeParseDate(c.registrationDate);
                return regDate && regDate >= filters.regDate.from && regDate <= filters.regDate.to;
            } catch { return false; }
        });
    }

    if (filters.enrDate?.from && filters.enrDate?.to) {
        filtered = filtered.filter((c) => {
            if (!c.enrollmentDate) return false;
            try {
                const enrDate = safeParseDate(c.enrollmentDate);
                return enrDate && enrDate >= filters.enrDate.from && enrDate <= filters.enrDate.to;
            } catch { return false; }
        });
    }

    return filtered.sort((a, b) => {
        const dateA = safeParseDate(a.registrationDate);
        const dateB = safeParseDate(b.registrationDate);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
    });
  }, [candidates, filters]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<any>(file, {
        header: true, skipEmptyLines: true,
        transformHeader: h => h.trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, ''),
        complete: (results) => {
          let updatedCount = 0; let addedCount = 0;
          const candidatesMap = new Map(candidates.map((c) => [c.registrationCode, c]));
          results.data.forEach((row) => {
            const registrationCode = row['CODIGO_DA_INSCRICAO']; if (!registrationCode) return;
            const firstPaymentPaid = row['PRIMEIRA_MENSALIDADE_COBRADA_PAGA'] === 'S';
            let csvStatus: Candidate['status'] = 'Registered';
            if (row['DATA_CANCELAMENTO'] && row['DATA_CANCELAMENTO'].trim() !== '') csvStatus = 'Canceled';
            else if (row['MATRICULOU'] === 'S') csvStatus = firstPaymentPaid ? 'Engaged' : 'Enrolled';
            const candidateData: Partial<Candidate> = {
              name: row['NOME'], cpf: row['CPF'] || null, registrationCode, registrationDate: row['DATA_DA_INSCRICAO'],
              enrollmentDate: row['DATA_MATRICULA'] || null, course: row['NOME_DO_CURSO'], phone: String(row['CELULAR'] || row['TELEFONE'] || '').trim(),
              email: row['EMAIL'] || null, specialist: row['ESPECIALIZACAO_MATRICULOU'] || null, birthDate: row['DATA_NASCIMENTO'] || null,
              firstPaymentPaid, paymentDate: row['DATA_PAGAMENTO_PRIMEIRA_MENSALIDADE'] || row['DATA_PAGAMENTO'] || null,
              entryMethod: row['ENTRADA_QUE_ALUNO_SELECIONOU'] || null, registrationLoginName: row['NOME_LOGIN_INSCRICAO'] || null,
              cancellationDate: row['DATA_CANCELAMENTO'] || null, city: row['CIDADE'] || null,
              enrollmentCode: row['MATRICULA'] || row['CODIGO_ALUNO'] || row['RA'] || null,
            };
            const existingCandidate = candidatesMap.get(registrationCode);
            if (existingCandidate) {
              candidatesMap.set(registrationCode, { ...existingCandidate, ...candidateData, status: (['Canceled', 'Enrolled', 'Engaged'].includes(csvStatus) || existingCandidate.status !== 'Contacted') ? csvStatus : 'Contacted' } as Candidate);
              updatedCount++;
            } else {
              candidatesMap.set(registrationCode, { id: uuidv4(), ...candidateData, status: csvStatus } as Candidate);
              addedCount++;
            }
          });
          setCandidates(Array.from(candidatesMap.values()));
          logAction('Importação de Candidatos', `Adicionados: ${addedCount}, Atualizados: ${updatedCount}.`);
          toast({ title: 'Importação Concluída', description: `${addedCount} novos e ${updatedCount} atualizados.` });
        }
      });
    }
  };

  const handleDeleteSelected = () => {
    const selectedIndices = Object.keys(rowSelection);
    const selectedIds = selectedIndices.map((index) => filteredCandidates[parseInt(index)].id);
    setCandidates(candidates.filter((c) => !selectedIds.includes(c.id)));
    logAction('Remoção de Candidatos', `${selectedIds.length} candidatos removidos.`);
    setRowSelection({});
  };

  const handleUpdateStatusForSelected = (newStatus: Candidate['status']) => {
    const selectedIndices = Object.keys(rowSelection);
    const selectedIds = selectedIndices.map((index) => filteredCandidates[parseInt(index)].id);
    setCandidates((prev) => prev.map((c) => {
        if (selectedIds.includes(c.id)) {
          let updates: Partial<Candidate> = { status: newStatus };
          if ((newStatus === 'Enrolled' || newStatus === 'Engaged') && !c.enrollmentDate) updates.enrollmentDate = new Date().toISOString();
          if (newStatus === 'Canceled' && !c.cancellationDate) updates.cancellationDate = new Date().toISOString();
          if (newStatus !== 'Canceled') updates.cancellationDate = null;
          return { ...c, ...updates };
        }
        return c;
    }));
    logAction('Status em Massa Atualizado', `${selectedIds.length} alterados para ${statusTranslations[newStatus]}.`);
    setRowSelection({});
  };

  const handleExport = () => {
    const candidatesToExport = Object.keys(rowSelection).length > 0 
      ? filteredCandidates.filter((_, index) => rowSelection[index])
      : filteredCandidates;

    if (candidatesToExport.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum candidato para exportar' });
        return;
    }

    let csv: string;
    if (exportFormat === 'google') {
      const headers = [
        "First Name", "Middle Name", "Last Name", "Phonetic First Name", "Phonetic Middle Name", "Phonetic Last Name",
        "Name Prefix", "Name Suffix", "Nickname", "File As", "Organization Name", "Organization Title", "Organization Department",
        "Birthday", "Notes", "Photo", "Labels", "E-mail 1 - Label", "E-mail 1 - Value", "Phone 1 - Label", "Phone 1 - Value"
      ];
      
      const rows = candidatesToExport.map(candidate => {
          const displayId = identifierSource === 'id' ? candidate.registrationCode : manualIdentifier.trim();
          const firstNameWithId = displayId ? `${candidate.name} (${displayId})` : candidate.name;
          const phone = formatPhoneNumberForWhatsApp(candidate.phone);
          
          return [
              firstNameWithId, "", "", "", "", "", "", "", "", "", "", "", "", 
              candidate.birthDate || '', "", "", "", 
              "Home", candidate.email || '', "Mobile", `+${phone}`
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });
      csv = [headers.join(','), ...rows].join('\r\n');
    } else {
      const data = candidatesToExport.map(c => ({ 
        'Nome': c.name, 'Telefone': c.phone, 'Curso': c.course, 'Inscrição': formatDateDisplay(c.registrationDate), 'Status': statusTranslations[c.status] || c.status, 'Código': c.registrationCode
      }));
      csv = Papa.unparse(data, { header: true, delimiter: ';' });
    }

    const blob = new Blob([exportFormat === 'google' ? "" : "\uFEFF", csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidatos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportDialogOpen(false);
    toast({ title: 'Exportação Concluída' });
  }

  return (
    <div className="w-full">
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div><h1 className="text-4xl font-headline font-bold tracking-tight text-primary">Candidatos</h1><p className="text-muted-foreground text-lg">Gestão da base comercial e de inscritos.</p></div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-background shadow-sm"><Upload className="mr-2 h-4 w-4 text-primary" /> Importar CSV</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
            <Button onClick={() => setIsExportDialogOpen(true)} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20"><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
          </div>
        </header>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Exportar Candidatos</DialogTitle>
                    <DialogDescription>Escolha o formato de exportação para Google Contatos ou visualização local.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Formato do Arquivo</Label>
                        <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="grid grid-cols-2 gap-4">
                            <div>
                              <RadioGroupItem value="google" id="r-google" className="peer sr-only" />
                              <Label htmlFor="r-google" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center font-bold">Google Contatos</Label>
                            </div>
                            <div>
                              <RadioGroupItem value="table" id="r-table" className="peer sr-only" />
                              <Label htmlFor="r-table" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center font-bold">Visão da Tabela</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {exportFormat === 'google' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Identificador no Nome</Label>
                                <RadioGroup value={identifierSource} onValueChange={(v: any) => setIdentifierSource(v)} className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                        <RadioGroupItem value="id" id="id-source" />
                                        <Label htmlFor="id-source" className="cursor-pointer font-medium">Cód. Inscrição</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                                        <RadioGroupItem value="manual" id="manual-source" />
                                        <Label htmlFor="manual-source" className="cursor-pointer font-medium">Personalizado</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {identifierSource === 'manual' && (
                                <div className="space-y-2">
                                    <Label htmlFor="manual-id" className="text-xs font-bold uppercase text-muted-foreground">Texto do Identificador</Label>
                                    <Input id="manual-id" placeholder="Ex: Vestibular 2024" value={manualIdentifier} onChange={e => setManualIdentifier(e.target.value)} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                    <Button onClick={handleExport} className="font-bold"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Accordion type="single" collapsible className="w-full mb-6">
          <AccordionItem value="filters" className="border-none">
            <AccordionTrigger className="bg-card px-6 py-4 rounded-xl shadow-sm hover:no-underline border border-primary/5">
                <div className="flex items-center gap-3 text-base font-semibold text-primary">
                    <div className="bg-primary/10 p-2 rounded-lg"><Filter className="h-4 w-4" /></div>
                    Filtros Avançados
                </div>
            </AccordionTrigger>
            <AccordionContent className="bg-card px-6 pb-6 rounded-b-xl border border-t-0 border-primary/5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Busca</Label><Input placeholder="Nome ou código..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</Label><MultiSelectFilter options={availableStatuses} selected={filters.status} onChange={v => setFilters({...filters, status: v})} title="Status" translations={statusTranslations} className="h-9 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Curso</Label><MultiSelectFilter options={availableCourses} selected={filters.course} onChange={v => setFilters({...filters, course: v})} title="Curso" className="h-9 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Especialista Inscrição</Label><MultiSelectFilter options={availableSpecialists} selected={filters.regSpec} onChange={v => setFilters({...filters, regSpec: v})} title="Esp. Inscr." className="h-9 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Especialista Matrícula</Label><MultiSelectFilter options={availableSpecialists} selected={filters.enrSpec} onChange={v => setFilters({...filters, enrSpec: v})} title="Esp. Matr." className="h-9 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label><MultiSelectFilter options={availableCities} selected={filters.city} onChange={v => setFilters({...filters, city: v})} title="Cidade" className="h-9 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mensalidade</Label>
                    <Select value={filters.payment} onValueChange={v => setFilters({...filters, payment: v})}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="paid">Paga</SelectItem><SelectItem value="not_paid">Não Paga</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data da Inscrição</Label><DateRangePicker date={filters.regDate} onSelect={v => setFilters({...filters, regDate: v})} className="h-9" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Data da Matrícula</Label><DateRangePicker date={filters.enrDate} onSelect={v => setFilters({...filters, enrDate: v})} className="h-9" /></div>
                  <div className="flex items-end pb-0.5">
                    <Button variant={hasActiveFilters ? "destructive" : "ghost"} onClick={() => setFilters({ search: '', status: [], course: [], regSpec: [], enrSpec: [], city: [], payment: 'all', regDate: undefined, enrDate: undefined })} className={cn("h-9 w-full sm:w-auto", hasActiveFilters ? "bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20" : "text-muted-foreground hover:text-rose-500")}><FilterX className="mr-2 h-4 w-4" /> Limpar Filtros</Button>
                  </div>
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3"><Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-none">{filteredCandidates.length} registros encontrados</Badge></div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {Object.keys(rowSelection).length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 font-bold">Ações em Massa ({Object.keys(rowSelection).length}) <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Status da Seleção</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('Registered')}>Inscrito</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('Contacted')}>Contatado</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('Enrolled')}>Matriculado</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('Engaged')}>Engajado</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('Canceled')}>Cancelado</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive font-semibold">Excluir Selecionados</DropdownMenuItem></AlertDialogTrigger>
                                    <AlertDialogContent aria-describedby={undefined}><AlertDialogHeader><AlertDialogTitle>Excluir candidatos?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá permanentemente {Object.keys(rowSelection).length} candidatos da base.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="sm" onClick={() => setRowSelection({})} className="h-9 text-muted-foreground hover:text-rose-500"><XCircle className="mr-2 h-4 w-4" /> Limpar Seleção</Button>
                    </div>
                )}
                <Button variant="outline" size="sm" className="h-9 font-semibold border-primary/20 text-primary hover:bg-primary/5" onClick={() => { const s: RowSelectionState = {}; filteredCandidates.forEach((_, i) => s[i] = true); setRowSelection(s); }}><CheckSquare className="mr-2 h-4 w-4" /> Selecionar Tudo</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 overflow-x-auto">
                <DataTable columns={columns} data={filteredCandidates} onRowClick={handleRowClick} rowSelection={rowSelection} setRowSelection={setRowSelection} />
            </div>
            <div className="hidden xl:block">
                <div className="sticky top-8 self-start h-[calc(100vh-140px)]">
                    <ScrollArea className="h-full pr-4">
                        {selectedCandidate ? (
                            <CandidatePreviewContent candidate={selectedCandidate} handleCopy={handleCopy} />
                        ) : (
                            <Card className="h-full border-dashed flex flex-col items-center justify-center py-12 text-center text-sm min-h-[500px]"><User className="h-16 w-16 text-muted-foreground/20 mb-4" /><h3 className="font-bold text-muted-foreground">Selecione um Candidato</h3></Card>
                        )}
                    </ScrollArea>
                </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col" aria-describedby={undefined}>
                    <SheetHeader className="p-6 border-b"><SheetTitle>Detalhes do Candidato</SheetTitle></SheetHeader>
                    <ScrollArea className="flex-1 p-6">{selectedCandidate && <CandidatePreviewContent candidate={selectedCandidate} handleCopy={handleCopy} />}</ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </div>
  );
}

export default function CandidatesPage() {
    return (<Suspense fallback={<LoadingComponent />}><CandidatesPageContent /></Suspense>)
}
