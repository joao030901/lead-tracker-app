'use client';

import { useStudents } from '@/context/students-context';
import { ArrowLeft, User, Mail, Phone, Book, GraduationCap, Building, Briefcase, CheckCircle, XCircle, Badge, Calendar, Clock, Lock, Key, Percent, Copy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { useParams, useRouter } from 'next/navigation';
import type { Student } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function InfoItem({ icon: Icon, label, value, onCopy }: { icon: any, label: string, value: string | boolean | null | undefined, onCopy?: (text: string, subject: string) => void }) {
    if (value === null || value === undefined || value === '') return null;
    
    if (typeof value === 'boolean') {
        return (
            <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${value ? 'text-green-500' : 'text-destructive'}`} />
                <div>
                    <span className="font-medium text-xs text-muted-foreground uppercase">{label}:</span> 
                    <p className={value ? 'text-green-600 font-bold' : 'text-destructive font-bold'}>
                        {value ? 'SIM' : 'NÃO'}
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground mt-1" />
            <div>
                <span className="font-medium text-xs text-muted-foreground uppercase">{label}:</span> 
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{value}</p>
                    {onCopy && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(String(value), label)}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { students } = useStudents();
  const { toast } = useToast();
  
  const id = typeof params.id === 'string' ? params.id : '';
  const student = students.find((s) => s.id === id);

  const handleCopy = (text: string, subject: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: `${subject} copiado!` });
    });
  };

  if (!student) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
        <h2 className="text-2xl font-bold">Aluno não encontrado</h2>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
        return dateString;
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto">
        <header className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para a lista
            </Button>
            <div className="flex items-center gap-4">
                <h1 className="text-4xl font-headline font-bold tracking-tight">{student.name}</h1>
                <BadgeUI variant={student.isActive ? 'default' : 'destructive'} className="text-base px-4 py-1">
                    {student.isActive ? 'ATIVO' : 'INATIVO'}
                </BadgeUI>
            </div>
            <div className="flex items-center gap-2 mt-2 font-mono bg-muted/50 px-2 py-1 rounded-md max-w-fit">
                <span className="text-muted-foreground text-sm font-bold">Matrícula: {student.id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(student.id, 'Matrícula')}>
                    <Copy className="h-3 w-3" />
                </Button>
            </div>
        </header>

        <div className="grid gap-6">
            <Card className="border-primary/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Ficha Acadêmica</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <InfoItem icon={User} label="Nome Completo" value={student.name} />
                        <InfoItem icon={Mail} label="Email" value={student.email} onCopy={handleCopy} />
                        <InfoItem icon={Phone} label="Telefone" value={student.phone} onCopy={handleCopy} />
                        <InfoItem icon={Phone} label="Celular" value={student.cellphone} onCopy={handleCopy} />
                    </div>
                    <div className="space-y-6">
                        <InfoItem icon={GraduationCap} label="Curso" value={student.courseName} />
                        <InfoItem icon={Book} label="Módulo Atual" value={student.module} />
                        <InfoItem icon={Building} label="Polo" value={student.poloName} />
                        <InfoItem icon={Briefcase} label="Parceiro" value={student.poloPartner} />
                    </div>
                    <div className="space-y-6">
                        <InfoItem icon={Badge} label="Situação Aluno" value={student.studentSituation} />
                        <InfoItem icon={Badge} label="Situação Matrícula" value={student.enrollmentSituation} />
                        <InfoItem icon={Calendar} label="Confirmação" value={formatDate(student.enrollmentConfirmationDate)} />
                        <InfoItem icon={Key} label="Ingresso" value={student.entryMethod} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Detalhes da Turma e Acesso</CardTitle></CardHeader>
                <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <InfoItem icon={Percent} label="Semestre" value={student.semester} />
                    <InfoItem icon={Clock} label="Turno" value={student.classShift} />
                    <InfoItem icon={Calendar} label="Dia do Encontro" value={student.classDay} />
                    <InfoItem icon={Lock} label="Ambiente Virtual" value={student.accessSystem} />
                    <InfoItem icon={XCircle} label="Inadimplência" value={student.isDefaulter} />
                    <InfoItem icon={Clock} label="Último Acesso" value={student.lastAccess ? formatDate(student.lastAccess) : 'N/A'} />
                    <InfoItem icon={User} label="Tutor Responsável" value={student.tutorName} />
                    <InfoItem icon={Mail} label="Email Tutor" value={student.tutorEmail} onCopy={handleCopy} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
