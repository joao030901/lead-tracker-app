
'use client';

import React, { useRef, useState, useMemo, Suspense } from 'react';
import { RowSelectionState, Row } from '@tanstack/react-table';
import Papa from 'papaparse';
import { getColumns } from './components/columns';
import { DataTable } from './components/data-table';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  Filter,
  CheckSquare,
  FilterX,
  User,
  Copy,
  Book,
  GraduationCap,
  Building,
  Briefcase,
  Calendar,
  Clock,
  Key,
  Percent,
  Phone,
  Mail,
  Loader2,
  XCircle,
  Trash2,
  ChevronDown,
  BadgeCheck,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Student } from '@/lib/types';
import { useStudents } from '@/context/students-context';
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
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateDisplay, formatPhoneNumberForWhatsApp } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditLog } from '@/context/audit-log-context';
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

const LoadingComponent = () => (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

function StudentPreviewContent({
  student,
  handleCopy,
}: {
  student: Student;
  handleCopy: (text: string, subject: string) => void;
}) {
  const InfoItem = ({
    icon: Icon,
    label,
    value,
    copyable = true,
    color = "primary"
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | null | boolean;
    copyable?: boolean;
    color?: string;
  }) => {
    if (value === null || value === undefined || value === '') return null;
    
    const iconColors = {
        primary: "text-primary",
        rose: "text-rose-500",
        indigo: "text-indigo-500",
        amber: "text-amber-500",
        emerald: "text-emerald-500"
    };

    if (typeof value === 'boolean') {
        return (
            <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <Icon className={cn("h-3 w-3", iconColors[color as keyof typeof iconColors])} />
                    {label}
                </div>
                <div className={cn("font-semibold uppercase text-sm", value ? "text-emerald-600" : "text-rose-600")}>
                    {value ? 'SIM' : 'NÃO'}
                </div>
            </div>
        );
    }
    
    return (
      <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <Icon className={cn("h-3 w-3", iconColors[color as keyof typeof iconColors])} />
            {label}
        </div>
        <div className="font-semibold flex items-center justify-between text-sm leading-tight">
            <span className="truncate pr-2">{value}</span>
            {copyable && (
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-background shrink-0" onClick={() => handleCopy(String(value), label)}>
                    <Copy className="h-3 w-3" />
                </Button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
        <div className="flex flex-col items-center text-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="bg-primary/10 p-3 rounded-full mb-3 text-primary">
                <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold font-headline leading-tight">{student.name}</h2>
            <div className="flex items-center gap-2 mt-2">
                <Badge variant={student.isActive ? 'default' : 'destructive'} className='text-[10px] py-0 px-2'>{student.isActive ? 'ATIVO' : 'INATIVO'}</Badge>
                <div className="text-muted-foreground flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase font-mono tracking-tighter group">
                    MATRÍCULA: {student.id}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => handleCopy(student.id, 'Matrícula')}
                    >
                        <Copy className="h-2.5 w-2.5" />
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
            <InfoItem icon={GraduationCap} label="Curso" value={student.courseName} color="indigo" />
            
            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Phone} label="Celular" value={student.cellphone} color="emerald" />
                <InfoItem icon={Building} label="Polo" value={student.poloName} color="amber" />
            </div>

            <InfoItem icon={Mail} label="Email" value={student.email} color="rose" />
            
            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Briefcase} label="Situação Aluno" value={student.studentSituation} color="indigo" />
                <InfoItem icon={Briefcase} label="Situação Matrícula" value={student.enrollmentSituation} color="indigo" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Calendar} label="Confirmação" value={formatDateDisplay(student.enrollmentConfirmationDate)} color="amber" />
                <InfoItem icon={Key} label="Forma de Ingresso" value={student.entryMethod} color="emerald" />
            </div>

            <Separator className="my-2" />

            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Book} label="Módulo" value={student.module} />
                <InfoItem icon={Percent} label="Semestre" value={student.semester} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Clock} label="Turno" value={student.classShift} />
                <InfoItem icon={Calendar} label="Dia do Encontro" value={student.classDay} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={XCircle} label="Inadimplente" value={student.isDefaulter} color="rose" />
                <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider"><Clock className="h-3 w-3" />Último Acesso</div>
                    <p className="font-semibold text-sm">{formatDateDisplay(student.lastAccess)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-2 border-t text-sm">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Acadêmico / Tutoria</h4>
                <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm">{student.tutorName || 'Tutor não vinculado'}</span>
                    </div>
                    {student.tutorEmail && <p className="text-xs text-muted-foreground ml-6 truncate">{student.tutorEmail}</p>}
                </div>
            </div>
        </div>
    </div>
  );
}

function StudentsPageContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { students, setStudents, selectedId, setSelectedId, filters, setFilters } = useStudents();
  const { logAction } = useAuditLog();
  const { toast } = useToast();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [identifierSource, setIdentifierSource] = useState<'id' | 'manual'>('id');
  const [exportFormat, setExportFormat] = useState('google');

  const selectedStudent = useMemo(() => students.find(s => s.id === selectedId), [students, selectedId]);
  
  const availableCourses = useMemo(() => [...new Set(students.map((s) => s.courseName).filter(Boolean) as string[])].sort(), [students]);
  const availableSituations = useMemo(() => [...new Set(students.map((s) => s.studentSituation).filter(Boolean) as string[])].sort(), [students]);
  const availableModules = useMemo(() => [...new Set(students.map((s) => s.module).filter(Boolean) as string[])].sort((a,b) => Number(a) - Number(b)), [students]);
  const availableTypes = useMemo(() => [...new Set(students.map((s) => s.studentType).filter(Boolean) as string[])].sort(), [students]);
  const availableDays = useMemo(() => [...new Set(students.map((s) => s.classDay).filter(Boolean) as string[])].sort(), [students]);
  
  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.course?.length || filters.situation?.length || filters.active !== 'all' || filters.module?.length || filters.type?.length || filters.day?.length || filters.defaulter !== 'all');
  }, [filters]);

  const handleCopy = (text: string, subject: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: `${subject} copiado!` });
    });
  };

  const handleRowClick = (row: Row<Student>) => {
    setSelectedId(row.original.id);
    if (window.innerWidth < 1280) {
        setIsSheetOpen(true);
    }
  };

  const handleDeleteIndividual = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    logAction('Remoção de Aluno', `Aluno '${student?.name}' (Matrícula: ${id}) removido.`);
    if (selectedId === id) setSelectedId(null);
    toast({ title: 'Aluno Removido' });
  };

  const handleDeleteSelected = () => {
    const selectedIndices = Object.keys(rowSelection);
    const selectedIds = selectedIndices.map((index) => filteredStudents[parseInt(index)].id);
    setStudents(students.filter((s) => !selectedIds.includes(s.id)));
    logAction('Remoção em Massa de Alunos', `${selectedIds.length} alunos removidos.`);
    setRowSelection({});
    if (selectedId && selectedIds.includes(selectedId)) setSelectedId(null);
    toast({ title: `${selectedIds.length} alunos removidos.` });
  };

  const columns = React.useMemo(() => getColumns(handleCopy, handleDeleteIndividual), [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    if (filters.search) {
        const l = filters.search.toLowerCase();
        filtered = filtered.filter(s => s.name.toLowerCase().includes(l) || s.id.toLowerCase().includes(l));
    }
    if (filters.course?.length > 0) filtered = filtered.filter(s => s.courseName && filters.course.includes(s.courseName));
    if (filters.situation?.length > 0) filtered = filtered.filter(s => s.studentSituation && filters.situation.includes(s.studentSituation));
    if (filters.active !== 'all') filtered = filtered.filter(s => s.isActive === (filters.active === 'true'));
    if (filters.module?.length > 0) filtered = filtered.filter(s => s.module && filters.module.includes(s.module));
    if (filters.type?.length > 0) filtered = filtered.filter(s => s.studentType && filters.type.includes(s.studentType));
    if (filters.day?.length > 0) filtered = filtered.filter(s => s.classDay && filters.day.includes(s.classDay));
    if (filters.defaulter !== 'all') filtered = filtered.filter(s => s.isDefaulter === (filters.defaulter === 'true'));
    
    return filtered;
  }, [students, filters]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<any>(file, {
        header: true, skipEmptyLines: true,
        transformHeader: h => h.trim().toUpperCase().replace(/[^a-zA-Z0-9_]/g, ''),
        complete: (results) => {
          const rawHeaders = results.meta.fields || [];
          const studentsMap = new Map(students.map((s) => [s.id, s]));
          let added = 0; let updated = 0;
          results.data.forEach((row) => {
            const id = row['COD_ALUNO']; if (!id) return;
            const lastAccessVal = rawHeaders.length > 23 ? row[rawHeaders[23]] : null;
            const data: Student = {
                id, name: row['NOME_ALUNO'] || 'N/A', email: row['EMAIL_ALUNO'], phone: row['FONE_ALUNO'],
                cellphone: row['CELULAR_ALUNO'], class: row['TURMA_ALUNO'], group: row['AGRUPAMENTO_ALUNO'],
                poloCode: row['COD_POLO'], poloName: row['NOME_POLO'], poloPartner: row['PARCEIRO_POLO'],
                courseCode: row['COD_CURSO'], courseName: row['NOME_CURSO'], module: row['MODULO'],
                studentType: row['TIPO_ALUNO'], studentSituation: row['SITUACAO_DO_ALUNO'],
                enrollmentSituation: row['SITUACAO_MATRICULA_ALUNO_SEMESTRE'], enrollmentConfirmationDate: row['DATA_CONF_MATRICULA'],
                isActive: ['S', 'SIM', 'TRUE'].includes(String(row['ALUNO_EH_ATIVO']).toUpperCase()),
                semester: row['SEMESTRE'], classShift: row['TURMA_TURNO'], classDay: row['TURMA_DIA'],
                isDefaulter: ['S', 'SIM', 'TRUE'].includes(String(row['INADIMPLENTE']).toUpperCase()),
                accessSystem: row['SISTEMA_ACESSO'], lastAccess: lastAccessVal,
                entryMethod: row['FORMA_INGRESSO'], tutorName: row['TUTOR'], tutorEmail: row['TUTOR_EMAIL'],
            };
            if (studentsMap.has(id)) updated++; else added++;
            studentsMap.set(id, { ...studentsMap.get(id), ...data } as Student);
          });
          setStudents(Array.from(studentsMap.values()));
          logAction('Importação de Alunos', `Adicionados: ${added}, Atualizados: ${updated}.`);
          toast({ title: 'Importação Concluída', description: `${added} novos e ${updated} atualizados.` });
        }
      });
    }
  };

  const handleExport = () => {
    const studentsToExport = Object.keys(rowSelection).length > 0 
      ? filteredStudents.filter((_, index) => rowSelection[index])
      : filteredStudents;

    if (studentsToExport.length === 0) {
        toast({ variant: 'destructive', title: 'Nenhum aluno para exportar' });
        return;
    }

    let csv: string;
    if (exportFormat === 'google') {
      const headers = [
        "First Name", "Middle Name", "Last Name", "Phonetic First Name", "Phonetic Middle Name", "Phonetic Last Name",
        "Name Prefix", "Name Suffix", "Nickname", "File As", "Organization Name", "Organization Title", "Organization Department",
        "Birthday", "Notes", "Photo", "Labels", "E-mail 1 - Label", "E-mail 1 - Value", "Phone 1 - Label", "Phone 1 - Value"
      ];
      
      const rows = studentsToExport.map(student => {
          const displayId = identifierSource === 'id' ? student.id : manualIdentifier.trim();
          const firstNameWithId = displayId ? `${student.name} (${displayId})` : student.name;
          const phone = formatPhoneNumberForWhatsApp(student.cellphone || '');
          
          return [
              firstNameWithId, "", "", "", "", "", "", "", "", "", "", "", "", 
              student.enrollmentConfirmationDate || '', "", "", "", 
              "Home", student.email || '', "Mobile", `+${phone}`
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      });
      csv = [headers.join(','), ...rows].join('\r\n');
    } else {
      const data = studentsToExport.map(s => ({ 
        'Nome': s.name, 'Matrícula': s.id, 'Curso': s.courseName, 'Situação': s.studentSituation, 'Status': s.isActive ? 'Ativo' : 'Inativo'
      }));
      csv = Papa.unparse(data, { header: true, delimiter: ';' });
    }

    const blob = new Blob([exportFormat === 'google' ? "" : "\uFEFF", csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setIsExportDialogOpen(false);
    toast({ title: 'Exportação Concluída' });
  }

  return (
    <div className="w-full">
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div><h1 className="text-4xl font-headline font-bold tracking-tight text-primary">Alunos</h1><p className="text-muted-foreground text-lg">Gerencie a base de alunos ativos e veteranos.</p></div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-background shadow-sm w-full sm:w-auto"><Upload className="mr-2 h-4 w-4 text-primary" /> Importar CSV</Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
            <Button onClick={() => setIsExportDialogOpen(true)} className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
          </div>
        </header>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Exportar Alunos</DialogTitle>
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
                                        <Label htmlFor="id-source" className="cursor-pointer font-medium">Matrícula</Label>
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
                                    <Input id="manual-id" placeholder="Ex: Aluno 2024" value={manualIdentifier} onChange={e => setManualIdentifier(e.target.value)} />
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
                    Filtros de Alunos
                </div>
            </AccordionTrigger>
            <AccordionContent className="bg-card px-6 pb-6 rounded-b-xl border border-t-0 border-primary/5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Busca</Label><Input placeholder="Nome ou matrícula..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="h-10 text-xs" /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Curso</Label><MultiSelectFilter options={availableCourses} selected={filters.course} onChange={v => setFilters({...filters, course: v})} title="Curso" className="h-10 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Situação</Label><MultiSelectFilter options={availableSituations} selected={filters.situation} onChange={v => setFilters({...filters, situation: v})} title="Situação" className="h-10 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ativo</Label>
                    <Select value={filters.active} onValueChange={v => setFilters({...filters, active: v})}>
                      <SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Módulo</Label><MultiSelectFilter options={availableModules} selected={filters.module} onChange={v => setFilters({...filters, module: v})} title="Módulo" className="h-10 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tipo</Label><MultiSelectFilter options={availableTypes} selected={filters.type} onChange={v => setFilters({...filters, type: v})} title="Tipo" className="h-10 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dia Encontro</Label><MultiSelectFilter options={availableDays} selected={filters.day} onChange={v => setFilters({...filters, day: v})} title="Dia" className="h-10 text-xs"/></div>
                  <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inadimplente</Label>
                    <Select value={filters.defaulter} onValueChange={v => setFilters({...filters, defaulter: v})}>
                      <SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="true">Sim</SelectItem><SelectItem value="false">Não</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant={hasActiveFilters ? "default" : "ghost"} onClick={() => setFilters({ search: '', course: [], situation: [], active: 'all', module: [], type: [], day: [], defaulter: 'all' })} className={cn("h-10 w-full", hasActiveFilters ? "bg-rose-500 text-white hover:bg-rose-600" : "text-muted-foreground hover:text-rose-500")}><FilterX className="mr-2 h-4 w-4" /> Limpar Filtros</Button>
                  </div>
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3"><Badge variant="secondary" className="px-4 py-1.5 text-sm font-bold bg-primary/10 text-primary border-none">{filteredStudents.length} alunos</Badge></div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {Object.keys(rowSelection).length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="h-9 font-bold"><Trash2 className="mr-2 h-4 w-4" /> Excluir ({Object.keys(rowSelection).length})</Button></AlertDialogTrigger>
                            <AlertDialogContent aria-describedby={undefined}>
                                <AlertDialogHeader><AlertDialogTitle>Excluir Alunos?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá permanentemente os {Object.keys(rowSelection).length} alunos selecionados.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="sm" onClick={() => setRowSelection({})} className="h-9 text-muted-foreground hover:text-rose-500"><XCircle className="mr-2 h-4 w-4" /> Limpar Seleção</Button>
                    </div>
                )}
                <Button variant="outline" size="sm" className="h-9 font-semibold border-primary/20 text-primary hover:bg-primary/5" onClick={() => { const s: RowSelectionState = {}; filteredStudents.forEach((_, i) => s[i] = true); setRowSelection(s); }}><CheckSquare className="mr-2 h-4 w-4" /> Selecionar Tudo</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 overflow-x-auto">
                <DataTable columns={columns} data={filteredStudents} onRowClick={handleRowClick} rowSelection={rowSelection} setRowSelection={setRowSelection} />
            </div>
            <div className="hidden xl:block">
                <div className="sticky top-8 self-start h-[calc(100vh-140px)]">
                    <ScrollArea className="h-full pr-4">
                        {selectedStudent ? (
                            <StudentPreviewContent student={selectedStudent} handleCopy={handleCopy} />
                        ) : (
                            <Card className="h-full border-dashed flex flex-col items-center justify-center py-12 text-center text-sm min-h-[500px]"><GraduationCap className="h-16 w-16 text-muted-foreground/20 mb-4" /><h3 className="font-bold text-muted-foreground">Selecione um Aluno</h3></Card>
                        )}
                    </ScrollArea>
                </div>
            </div>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 overflow-hidden flex flex-col" aria-describedby={undefined}>
                    <SheetHeader className="p-6 border-b"><SheetTitle>Ficha do Aluno</SheetTitle></SheetHeader>
                    <ScrollArea className="flex-1 p-6">{selectedStudent && <StudentPreviewContent student={selectedStudent} handleCopy={handleCopy} />}</ScrollArea>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
    return (<Suspense fallback={<LoadingComponent />}><StudentsPageContent /></Suspense>)
}
