
'use client';

import React, { useState, useMemo, useRef, Suspense } from 'react';
import { RowSelectionState, Row } from '@tanstack/react-table';
import Papa from 'papaparse';
import { useLeads } from '@/context/leads-context';
import { useAuditLog } from '@/context/audit-log-context';
import { useToast } from '@/hooks/use-toast';
import { KanbanBoard } from './components/kanban-board';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  ArrowRight, 
  MessageSquare, 
  Clock, 
  ClipboardList, 
  Upload, 
  FilterX, 
  Copy, 
  Mail, 
  Book, 
  MapPin, 
  Phone, 
  Filter, 
  Loader2,
  Trash2,
  ChevronDown,
  CheckSquare,
  XCircle,
  Fingerprint,
  Tag,
  Contact,
  Download,
  LayoutGrid,
  List
} from 'lucide-react';
import { Lead, Candidate } from '@/lib/types';
import { useTemplates } from '@/context/templates-context';
import { useCandidates } from '@/context/candidates-context';
import { v4 as uuidv4 } from 'uuid';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { fillTemplate, formatPhoneNumberForWhatsApp, formatDateDisplay, cn, safeParseDate } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isValid, parseISO } from 'date-fns';
import ScheduleReminderCard from '../candidates/[id]/components/schedule-reminder-card';
import FollowUpHistoryCard from '../candidates/[id]/components/follow-up-history';

const statusTranslations: { [key: string]: string } = {
  'new': 'Novo',
  'contacted': 'Contatado',
  'converted': 'Convertido',
  'discarded': 'Descartado',
};

const LoadingComponent = () => (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

function ConvertToCandidateDialog({ lead, isOpen, onOpenChange }: { lead: Lead | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { setLeads } = useLeads();
    const { setCandidates, candidates } = useCandidates();
    const { toast } = useToast();
    const { logAction } = useAuditLog();
    const [registrationCode, setRegistrationCode] = useState('');

    const handleConvert = () => {
        if (!lead || !registrationCode.trim()) return;
        const isDuplicate = candidates.some(c => c.registrationCode === registrationCode);
        if (isDuplicate) {
            toast({ title: "Erro", description: "Já existe um candidato com este código.", variant: "destructive" });
            return;
        }
        const newCandidate: Candidate = {
            id: uuidv4(), name: lead.name, email: lead.email, phone: lead.phone, cpf: lead.cpf,
            course: lead.course, city: lead.unit, registrationCode, registrationDate: new Date().toISOString(),
            status: 'Registered', enrollmentDate: null, specialist: null, birthDate: null, firstPaymentPaid: null, entryMethod: 'Lead', cancellationDate: null,
        };
        setCandidates(prev => [...prev, newCandidate]);
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'converted' } : l));
        logAction('Criação de Candidato', `Lead '${lead.name}' convertido.`);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Converter Lead em Candidato</DialogTitle>
                    <DialogDescription>
                        Insira o código de inscrição gerado no sistema.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2"><Label>Código de Inscrição</Label><Input value={registrationCode} onChange={e => setRegistrationCode(e.target.value)} placeholder="Digite o código..." /></div>
                <DialogFooter><Button onClick={handleConvert}>Confirmar Conversão</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LeadPreviewContent({ lead, onConvertClick, handleCopy }: { lead: Lead; onConvertClick: (lead: Lead) => void; handleCopy: (text: string, subject: string) => void; }) {
    const { templates } = useTemplates();

    const handleTemplateClick = (templateContent: string) => {
        const message = fillTemplate(templateContent, lead as any);
        window.open(`https://wa.me/${formatPhoneNumberForWhatsApp(lead.phone)}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const InfoItem = ({ icon: Icon, label, value, color = "primary" }: { icon: any, label: string, value?: string | null, color?: string }) => (
        value ? (
            <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <Icon className={cn("h-3 w-3", color === "rose" ? "text-rose-500" : color === "indigo" ? "text-indigo-500" : color === "amber" ? "text-amber-500" : "text-primary")} />
                    {label}
                </div>
                <div className="font-semibold flex items-center justify-between text-sm leading-tight">
                    <span className="truncate pr-2">{value}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100 hover:bg-background shrink-0" onClick={() => handleCopy(value, label)}>
                        <Copy className="h-2.5 w-2.5" />
                    </Button>
                </div>
            </div>
        ) : null
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col items-center text-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="bg-primary/10 p-3 rounded-full mb-3 text-primary">
                    <Contact className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold font-headline leading-tight">{lead.name}</h2>
                <Badge variant="outline" className="mt-2 uppercase text-[10px] tracking-widest font-bold">
                    CRIADO EM {formatDateDisplay(lead.createdAt)}
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <InfoItem icon={Book} label="Curso de Interesse" value={lead.course} color="indigo" />
                
                <div className="flex flex-col gap-1 text-sm bg-muted/20 p-2 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Phone className="h-3 w-3 text-emerald-500" />
                        Telefone
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{lead.phone}</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(lead.phone, 'Telefone')}>
                                <Copy className="h-3 w-3" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"><MessageSquare className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel className="text-xs">WhatsApp</DropdownMenuLabel><DropdownMenuSeparator />
                                    {templates.map((template) => (<DropdownMenuItem key={template.id} onClick={() => handleTemplateClick(template.content)} className="text-xs">{template.name}</DropdownMenuItem>))}
                                    <DropdownMenuSeparator /><DropdownMenuItem onClick={() => window.open(`https://wa.me/${formatPhoneNumberForWhatsApp(lead.phone)}`, '_blank')} className="text-xs font-semibold">Mensagem Manual</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                <InfoItem icon={Mail} label="Email" value={lead.email} color="rose" />
                <InfoItem icon={Tag} label="Tipo de Registro" value={lead.entryType} color="amber" />
                <InfoItem icon={MapPin} label="Unidade" value={lead.unit} color="indigo" />
                <InfoItem icon={Fingerprint} label="CPF" value={lead.cpf} />
            </div>

            <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" onClick={() => onConvertClick(lead)}>
                Converter em Candidato <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <ScheduleReminderCard candidate={lead as any} />
            <FollowUpHistoryCard candidate={lead as any} />
        </div>
    );
}

function LeadsPageContent() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { leads, setLeads, selectedId, setSelectedId, filters, setFilters } = useLeads();
    const { logAction } = useAuditLog();
    const { toast } = useToast();
    const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [manualIdentifier, setManualIdentifier] = useState('');
    const [identifierSource, setIdentifierSource] = useState<'manual' | 'id'>('manual');
    const [exportFormat, setExportFormat] = useState('google');

    const selectedLead = useMemo(() => leads.find(l => l.id === selectedId), [leads, selectedId]);

    const handleCopy = (text: string, subject: string) => {
        navigator.clipboard.writeText(text).then(() => { toast({ title: `${subject} copiado!` }); });
    };

    const handleRowClick = (row: Row<Lead>) => {
        setSelectedId(row.original.id);
        if (window.innerWidth < 1280) {
            setIsSheetOpen(true);
        }
    };

    const availableCourses = useMemo(() => [...new Set(leads.map((l) => l.course))].sort(), [leads]);
    const availableUnits = useMemo(() => [...new Set(leads.map((l) => l.unit))].sort(), [leads]);
    const statusLabels = { new: 'Novo', contacted: 'Contatado', converted: 'Convertido', discarded: 'Descartado' };

    const hasActiveFilters = useMemo(() => {
        return !!(filters.search || filters.status?.length || filters.course?.length || filters.unit?.length || filters.date);
    }, [filters]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            Papa.parse<any>(file, {
                header: false, skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data;
                    if (data.length <= 1) return;
                    const existingLeadsMap = new Map(leads.map(l => [formatPhoneNumberForWhatsApp(l.phone), l]));
                    let addedCount = 0; let updatedCount = 0;
                    const updatedLeadsList = [...leads];
                    data.slice(1).forEach((row: any[]) => {
                        const entryType = row[2]; const creationDate = row[4]; const name = (row[5] || '').trim(); const course = row[7] || 'N/A'; const unit = row[9] || 'N/A'; const phone = String(row[10] || '').trim(); const email = row[11] || null; 
                        if (!name || !phone) return;
                        const normalizedPhone = formatPhoneNumberForWhatsApp(phone);
                        const existingLead = existingLeadsMap.get(normalizedPhone);
                        if (existingLead) {
                            const index = updatedLeadsList.findIndex(l => l.id === existingLead.id);
                            if (index !== -1) {
                                updatedLeadsList[index] = { ...existingLead, name, email: email || existingLead.email, course: course || existingLead.course, unit: unit || existingLead.unit, entryType: entryType || existingLead.entryType };
                                updatedCount++;
                            }
                        } else {
                            const newLead: Lead = { id: uuidv4(), name, email, phone, cpf: null, course, unit, status: 'new', createdAt: creationDate || new Date().toISOString(), entryType: entryType || null };
                            updatedLeadsList.push(newLead); existingLeadsMap.set(normalizedPhone, newLead); addedCount++;
                        }
                    });
                    setLeads(updatedLeadsList);
                    logAction('Importação de Leads', `Importados ${addedCount} novos e atualizados ${updatedCount}.`);
                    toast({ title: 'Importação Concluída', description: `${addedCount} novos e ${updatedCount} atualizados.` });
                }
            });
        }
    }

    const filteredLeads = useMemo(() => {
        let filtered = leads;
        if (filters.search) {
            const l = filters.search.toLowerCase();
            filtered = filtered.filter(le => le.name.toLowerCase().includes(l) || (le.email && le.email.toLowerCase().includes(l)));
        }
        if (filters.status?.length) filtered = filtered.filter(c => filters.status.includes(c.status));
        if (filters.course?.length) filtered = filtered.filter(c => filters.course.includes(c.course));
        if (filters.unit?.length) filtered = filtered.filter(c => filters.unit.includes(c.unit));
        
        return filtered.sort((a, b) => {
            const dateA = safeParseDate(a.createdAt);
            const dateB = safeParseDate(b.createdAt);
            if (!dateA || !dateB) return 0;
            return dateB.getTime() - dateA.getTime();
        });
    }, [leads, filters]);

    const handleDeleteSelected = () => {
        const selectedIndices = Object.keys(rowSelection);
        const selectedIds = selectedIndices.map((index) => filteredLeads[parseInt(index)].id);
        setLeads(leads.filter((l) => !selectedIds.includes(l.id)));
        logAction('Remoção de Leads', `${selectedIds.length} leads removidos.`);
        setRowSelection({});
    };

    const handleUpdateStatusForSelected = (newStatus: Lead['status']) => {
        const selectedIndices = Object.keys(rowSelection);
        const selectedIds = selectedIndices.map((index) => filteredLeads[parseInt(index)].id);
        setLeads((prev) => prev.map((l) => selectedIds.includes(l.id) ? { ...l, status: newStatus } : l));
        setRowSelection({});
    };

    const handleExport = () => {
        const leadsToExport = Object.keys(rowSelection).length > 0
          ? filteredLeads.filter((_, index) => rowSelection[index])
          : filteredLeads;
    
        if (leadsToExport.length === 0) {
            toast({ variant: 'destructive', title: 'Nenhum lead para exportar' });
            return;
        }
    
        let csv: string;
        if (exportFormat === 'google') {
          const headers = [
            "First Name", "Middle Name", "Last Name", "Phonetic First Name", "Phonetic Middle Name", "Phonetic Last Name",
            "Name Prefix", "Name Suffix", "Nickname", "File As", "Organization Name", "Organization Title", "Organization Department",
            "Birthday", "Notes", "Photo", "Labels", "E-mail 1 - Label", "E-mail 1 - Value", "Phone 1 - Label", "Phone 1 - Value"
          ];
          
          const rows = leadsToExport.map(lead => {
              const displayId = manualIdentifier.trim();
              const firstNameWithId = displayId ? `${lead.name} (${displayId})` : lead.name;
              const phone = formatPhoneNumberForWhatsApp(lead.phone);
              
              return [
                  firstNameWithId, "", "", "", "", "", "", "", "", "", "", "", "", 
                  "", "", "", "", 
                  "Home", lead.email || '', "Mobile", `+${phone}`
              ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
          });
          csv = [headers.join(','), ...rows].join('\r\n');
        } else {
          const data = leadsToExport.map(l => ({ 'Nome': l.name, 'WhatsApp': l.phone, 'Curso': l.course, 'Unidade': l.unit, 'Status': statusTranslations[l.status] || l.status }));
          csv = Papa.unparse(data, { header: true, delimiter: ';' });
        }
    
        const blob = new Blob([exportFormat === 'google' ? "" : "\uFEFF", csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        setIsExportDialogOpen(false);
        toast({ title: 'Exportação Concluída' });
      }

    return (
        <div className="w-full">
            {leadToConvert && (<ConvertToCandidateDialog lead={leadToConvert} isOpen={!!leadToConvert} onOpenChange={o => !o && setLeadToConvert(null)} />)}
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader><DialogTitle>Exportar Leads</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Formato</Label>
                            <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="grid grid-cols-2 gap-4">
                                <div><RadioGroupItem value="google" id="r-google" className="peer sr-only" /><Label htmlFor="r-google" className="flex flex-col items-center border-2 border-muted bg-popover p-4 cursor-pointer peer-data-[state=checked]:border-primary font-bold text-center">Google Contatos</Label></div>
                                <div><RadioGroupItem value="table" id="r-table" className="peer sr-only" /><Label htmlFor="r-table" className="flex flex-col items-center border-2 border-muted bg-popover p-4 cursor-pointer peer-data-[state=checked]:border-primary font-bold text-center">Visão Tabela</Label></div>
                            </RadioGroup>
                        </div>
                        {exportFormat === 'google' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label htmlFor="manual-id" className="text-xs font-bold uppercase text-muted-foreground">Texto do Identificador</Label>
                                    <Input id="manual-id" placeholder="Ex: Lead Facebook" value={manualIdentifier} onChange={e => setManualIdentifier(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter><DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose><Button onClick={handleExport} className="font-bold">Exportar</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div><h1 className="text-4xl font-headline font-bold tracking-tight text-primary">Leads</h1><p className="text-muted-foreground text-lg">Triagem inicial de contatos comerciais.</p></div>
                     <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-background shadow-sm w-full sm:w-auto"><Upload className="mr-2 h-4 w-4 text-primary" /> Importar CSV</Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                        <Button onClick={() => setIsExportDialogOpen(true)} className="bg-primary text-primary-foreground shadow-lg w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                    </div>
                </header>

                <Accordion type="single" collapsible className="w-full mb-6">
                    <AccordionItem value="filters" className="border-none">
                        <AccordionTrigger className="bg-card px-6 py-4 rounded-xl shadow-sm border border-primary/5"><div className="flex items-center gap-3 text-base font-semibold text-primary"><Filter className="h-4 w-4" /> Filtros de Leads</div></AccordionTrigger>
                        <AccordionContent className="bg-card px-6 pb-6 rounded-b-xl border border-primary/5 shadow-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                                <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Busca</Label><Input placeholder="Nome..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="h-10 text-xs" /></div>
                                <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Status</Label><MultiSelectFilter options={Object.keys(statusLabels)} selected={filters.status} onChange={v => setFilters({...filters, status: v})} title="Status" translations={statusLabels} className="h-10 text-xs" /></div>
                                <div className="space-y-2"><Label className="text-[10px] font-bold uppercase">Curso</Label><MultiSelectFilter options={availableCourses} selected={filters.course} onChange={v => setFilters({...filters, course: v})} title="Curso" className="h-10 text-xs" /></div>
                                <div className="flex items-end"><Button variant={hasActiveFilters ? "default" : "ghost"} onClick={() => setFilters({ search: '', status: [], course: [], unit: [], date: undefined })} className={cn("h-10 w-full", hasActiveFilters ? "bg-rose-500 text-white" : "text-muted-foreground")}><FilterX className="mr-2 h-4 w-4" /> Limpar</Button></div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Tabs defaultValue="kanban" className="w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="px-4 py-1.5 font-bold bg-primary/10 text-primary border-none">{filteredLeads.length} leads</Badge>
                            <TabsList className="bg-card border shadow-sm">
                                <TabsTrigger value="kanban" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><LayoutGrid className="h-4 w-4 mr-2" /> Kanban</TabsTrigger>
                                <TabsTrigger value="table"><List className="h-4 w-4 mr-2" /> Lista</TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {Object.keys(rowSelection).length > 0 && (
                                <div className="flex items-center gap-2">
                                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Ações em Massa ({Object.keys(rowSelection).length}) <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('new')}>Novo</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('contacted')}>Contatado</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatusForSelected('discarded')}>Descartado</DropdownMenuItem>
                                            <DropdownMenuSeparator /><AlertDialog><AlertDialogTrigger asChild><DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive font-semibold">Excluir</DropdownMenuItem></AlertDialogTrigger><AlertDialogContent aria-describedby={undefined}><AlertDialogHeader><AlertDialogTitle>Excluir leads?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive">Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                                    </DropdownMenuContent></DropdownMenu>
                                    <Button variant="ghost" size="sm" onClick={() => setRowSelection({})} className="text-muted-foreground hover:text-rose-500"><XCircle className="h-4 w-4" /></Button>
                                </div>
                            )}
                            <Button variant="outline" size="sm" onClick={() => { const s: RowSelectionState = {}; filteredLeads.forEach((_, i) => s[i] = true); setRowSelection(s); }}><CheckSquare className="mr-2 h-4 w-4" /> Selecionar Tudo</Button>
                        </div>
                    </div>

                    <TabsContent value="kanban" className="mt-0">
                        <KanbanBoard filteredLeads={filteredLeads} onCardClick={(lead) => { setSelectedId(lead.id); setIsSheetOpen(true); }} />
                    </TabsContent>

                    <TabsContent value="table" className="mt-0">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 overflow-x-auto"><DataTable columns={columns(setLeadToConvert)} data={filteredLeads} onRowClick={handleRowClick} rowSelection={rowSelection} setRowSelection={setRowSelection} /></div>
                            <div className="hidden xl:block"><div className="sticky top-8 h-[calc(100vh-140px)]"><ScrollArea className="h-full pr-4">{selectedLead ? (<LeadPreviewContent lead={selectedLead} onConvertClick={setLeadToConvert} handleCopy={handleCopy} />) : (<Card className="h-full border-dashed flex flex-col items-center justify-center py-12 text-center text-sm min-h-[500px]"><Contact className="h-16 w-16 text-muted-foreground/20 mb-4" /><h3 className="font-bold text-muted-foreground">Selecione um Lead</h3></Card>)}</ScrollArea></div></div>
                        </div>
                    </TabsContent>
                </Tabs>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}><SheetContent className="w-full sm:max-w-md p-0 flex flex-col" aria-describedby={undefined}><SheetHeader className="p-6 border-b"><SheetTitle>Detalhes do Lead</SheetTitle></SheetHeader><ScrollArea className="flex-1 p-6">{selectedLead && (<LeadPreviewContent lead={selectedLead} onConvertClick={setLeadToConvert} handleCopy={handleCopy} />)}</ScrollArea></SheetContent></Sheet>
            </div>
        </div>
    );
}

export default function LeadsPage() {
    return (<Suspense fallback={<LoadingComponent />}><LeadsPageContent /></Suspense>)
}
