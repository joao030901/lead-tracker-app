'use client';

import { useLeads } from '@/context/leads-context';
import { ArrowLeft, User, Mail, Phone, Book, MapPin, Clock, Copy, ClipboardList, BellPlus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTemplates } from '@/context/templates-context';
import { fillTemplate, formatPhoneNumberForWhatsApp, formatDateDisplay } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Candidate } from '@/lib/types';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { leads } = useLeads();
  const { templates } = useTemplates();
  const { toast } = useToast();
  
  const id = typeof params.id === 'string' ? params.id : '';
  const lead = leads.find((l) => l.id === id);

  const handleCopy = (text: string, subject: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: `${subject} copiado!` });
    });
  };

  const handleTemplateClick = (templateContent: string) => {
    if (!lead) return;
    const message = fillTemplate(templateContent, lead as unknown as Candidate);
    window.open(`https://wa.me/${formatPhoneNumberForWhatsApp(lead.phone)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!lead) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold">Lead não encontrado</h2>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
            </Button>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold">{lead.name}</h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <MessageSquare className="mr-2 h-4 w-4" /> Enviar WhatsApp
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Modelos</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {templates.map(t => (
                            <DropdownMenuItem key={t.id} onClick={() => handleTemplateClick(t.content)}>{t.name}</DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Informações do Lead</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Book className="h-5 w-5 text-muted-foreground" />
                        <div><p className="text-xs font-bold text-muted-foreground uppercase">Curso de Interesse</p><p className="font-semibold">{lead.course}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div><p className="text-xs font-bold text-muted-foreground uppercase">Telefone</p><p className="font-semibold">{lead.phone}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div><p className="text-xs font-bold text-muted-foreground uppercase">Email</p><p className="font-semibold">{lead.email || 'N/A'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div><p className="text-xs font-bold text-muted-foreground uppercase">Unidade</p><p className="font-semibold">{lead.unit}</p></div>
                    </div>
                    <div className="flex items-center gap-3 border-t pt-4">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div><p className="text-xs font-bold text-muted-foreground uppercase">Criado em</p><p className="font-semibold">{formatDateDisplay(lead.createdAt, "PPP")}</p></div>
                    </div>
                </CardContent>
            </Card>
            
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5"/> Histórico de Notas</CardTitle></CardHeader>
                    <CardContent>
                        {lead.followUpHistory?.length ? (
                            <div className="space-y-4">
                                {lead.followUpHistory.map(h => (
                                    <div key={h.id} className="p-3 border rounded bg-muted/30">
                                        <p className="text-xs font-bold text-muted-foreground mb-1">{formatDateDisplay(h.date, "dd/MM/yy HH:mm")}</p>
                                        <p className="text-sm">{h.note}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground text-center py-4">Sem registros.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
