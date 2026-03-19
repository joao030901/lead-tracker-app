
'use client';

import { useCandidates } from '@/context/candidates-context';
import { ArrowLeft, Book, Calendar, Phone, User, CheckCircle, Target, Briefcase, Cake, Mail, BadgeCheck, LogIn, XCircle, MapPin, Copy, MessageSquare, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter } from 'next/navigation';
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
import { useTemplates } from '@/context/templates-context';
import type { Candidate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { differenceInYears, parseISO, format } from 'date-fns';
import { cn, fillTemplate, formatPhoneNumberForWhatsApp, formatDateDisplay } from '@/lib/utils';
import ScheduleReminderCard from './components/schedule-reminder-card';
import FollowUpHistoryCard from './components/follow-up-history';

const calculateAge = (birthDate: string | null | undefined): number | null => {
    if (!birthDate) return null;
    try {
        const date = parseISO(birthDate);
        return differenceInYears(new Date(), date);
    } catch {
        return null;
    }
}

function InfoItem({ icon: Icon, label, value, onCopy }: { icon: any, label: string, value: string | null | undefined, onCopy: (text: string, subject: string) => void }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center gap-1">
                <span className="font-medium">{label}:</span> 
                <span>{value}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onCopy(value, label)}>
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { candidates } = useCandidates();
  const { templates } = useTemplates();
  const { toast } = useToast();
  
  const id = typeof params.id === 'string' ? params.id : '';
  const candidate = candidates.find((c) => c.id === id);

  const handleTemplateClick = (templateContent: string) => {
    if (!candidate) return;
    const message = fillTemplate(templateContent, candidate);
    const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(candidate.phone)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleManualMessage = () => {
    if (!candidate) return;
    const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(candidate.phone)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopy = (text: string, subject: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({
            title: `${subject} copiado!`,
            description: `O ${subject.toLowerCase()} ${text} foi copiado para a área de transferência.`,
        });
    }).catch(err => {
        console.error('Failed to copy: ', err);
        toast({
            variant: 'destructive',
            title: 'Erro ao copiar',
            description: `Não foi possível copiar o ${subject.toLowerCase()}.`,
        });
    });
  };

  if (!candidate) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold">Candidato não encontrado</h2>
            <p className="text-muted-foreground">O candidato que você está procurando não existe ou foi removido.</p>
            <Button asChild className="mt-4">
            <Link href="/candidates">Voltar para a lista</Link>
            </Button>
        </div>
      </div>
    );
  }
  
  const statusTranslations: { [key: string]: string } = {
    'Enrolled': 'Matriculado',
    'Contacted': 'Contatado',
    'Registered': 'Inscrito',
    'Canceled': 'Cancelado',
  };

  const statusVariant: 'default' | 'secondary' | 'outline' | 'destructive' = 
    candidate.status === 'Canceled' ? 'destructive' :
    candidate.enrollmentDate ? 'default' :
    candidate.status === 'Contacted' ? 'secondary' : 'outline';
    
  const age = calculateAge(candidate.birthDate);
    
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
        <header>
          <div className="flex items-center gap-4 mb-2">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft />
              </Button>
              <h1 className="text-3xl font-headline font-bold tracking-tight">
              {candidate.name}
              </h1>
              <Badge variant={statusVariant}>{statusTranslations[candidate.status]}</Badge>
          </div>
          <div className="text-muted-foreground ml-14 flex items-center gap-1 bg-muted/50 p-1 rounded-md max-w-fit">
              <span className="text-sm font-semibold">Cód. Inscrição: {candidate.registrationCode}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(candidate.registrationCode, 'Código de Inscrição')}>
                  <Copy className="h-4 w-4" />
              </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3 mt-8">
          <div className="lg:col-span-2 space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Informações do Candidato</CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                      <InfoItem icon={User} label="Nome" value={candidate.name} onCopy={handleCopy} />
                      <InfoItem icon={Book} label="Curso" value={candidate.course} onCopy={handleCopy} />
                      <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Telefone:</span> 
                            <span>{candidate.phone}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(candidate.phone, 'Telefone')}>
                                <Copy className="h-3 w-3" />
                            </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700">
                                        <MessageSquare />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Enviar WhatsApp</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {templates.map(template => (
                                        <DropdownMenuItem key={template.id} onClick={() => handleTemplateClick(template.content)}>
                                            {template.name}
                                        </DropdownMenuItem>
                                    ))}
                                    {templates.length > 0 && <DropdownMenuSeparator />}
                                    <DropdownMenuItem onClick={handleManualMessage}>
                                        Escrever mensagem
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                      </div>
                      <InfoItem icon={Mail} label="Email" value={candidate.email} onCopy={handleCopy} />
                      <InfoItem icon={MapPin} label="Cidade" value={candidate.city} onCopy={handleCopy} />
                      
                      <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                           <div className="flex items-center gap-1">
                                <span className="font-medium">Inscrição:</span> 
                                <span>{new Date(candidate.registrationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                 <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(new Date(candidate.registrationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 'Data de Inscrição')}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                           </div>
                      </div>

                       {candidate.birthDate && (
                           <div className="flex items-start gap-3">
                              <Cake className="h-5 w-5 text-muted-foreground" />
                               <div className="flex items-center gap-1">
                                <span className="font-medium">Nascimento:</span> 
                                <span>{new Date(candidate.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} {age !== null && `(${age} anos)`}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(new Date(candidate.birthDate!).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 'Data de Nascimento')}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                          </div>
                      )}
                      
                      <InfoItem icon={LogIn} label="Forma de Ingresso" value={candidate.entryMethod} onCopy={handleCopy} />
                      
                      {candidate.enrollmentDate && (
                      <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                           <div className="flex items-center gap-1">
                                <span className="font-medium">Matriculado em:</span> 
                                <span>{new Date(candidate.enrollmentDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(new Date(candidate.enrollmentDate!).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 'Data de Matrícula')}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                           </div>
                      </div>
                      )}

                       {candidate.cancellationDate && (
                      <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-destructive" />
                           <div className="flex items-center gap-1">
                            <span className="font-medium">Cancelado em:</span> 
                            <span>{new Date(candidate.cancellationDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(new Date(candidate.cancellationDate!).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), 'Data de Cancelamento')}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                           </div>
                      </div>
                      )}

                      {candidate.status === 'Enrolled' && candidate.firstPaymentPaid !== null && candidate.firstPaymentPaid !== undefined && (
                        <div className="flex items-start gap-3">
                            <BadgeCheck className={cn("h-5 w-5", candidate.firstPaymentPaid ? "text-green-500" : "text-destructive")} />
                            <div>
                                <span className="font-medium">Primeira Mensalidade:</span> 
                                <span className={cn(candidate.firstPaymentPaid ? "text-green-600" : "text-destructive")}>
                                    {candidate.firstPaymentPaid ? ' Paga' : ' Não Paga'}
                                </span>
                            </div>
                        </div>
                      )}
                      <InfoItem icon={Target} label="Demografia" value={candidate.demographics} onCopy={handleCopy} />
                      <InfoItem icon={Briefcase} label="Especialista Inscrição" value={candidate.registrationLoginName} onCopy={handleCopy} />
                      <InfoItem icon={Briefcase} label="Especialista Matrícula" value={candidate.specialist} onCopy={handleCopy} />
                  </CardContent>
              </Card>
              <FollowUpHistoryCard candidate={candidate} />
          </div>
          <div className="space-y-6">
              <ScheduleReminderCard candidate={candidate} />
          </div>
        </div>
    </div>
  );
}
