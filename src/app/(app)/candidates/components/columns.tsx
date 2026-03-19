
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MessageSquare, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Candidate } from '@/lib/types';
import { useTemplates } from '@/context/templates-context';
import { useCandidates } from '@/context/candidates-context';
import { useAuditLog } from '@/context/audit-log-context';
import { fillTemplate, formatPhoneNumberForWhatsApp, formatDateDisplay } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const statusTranslations: { [key: string]: string } = {
  'Registered': 'Inscrito',
  'Contacted': 'Contatado',
  'Enrolled': 'Matriculado',
  'Engaged': 'Engajado',
  'Canceled': 'Cancelado',
};

const statusVariants: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  Enrolled: 'secondary',
  Contacted: 'secondary',
  Registered: 'outline',
  Canceled: 'destructive',
  Engaged: 'default',
};

const StatusCell = ({ row }: { row: any }) => {
    const { candidates, setCandidates } = useCandidates();
    const { logAction } = useAuditLog();
    const candidate = row.original as Candidate;
    const currentStatus = candidate.status;
    
    const handleStatusChange = (e: React.MouseEvent, newStatus: Candidate['status']) => {
        e.stopPropagation();
        const updatedCandidates = candidates.map(c => {
            if (c.id === candidate.id) {
                let updated: Partial<Candidate> = { status: newStatus };
                if ((newStatus === 'Enrolled' || newStatus === 'Engaged') && !c.enrollmentDate) updated.enrollmentDate = new Date().toISOString();
                if (newStatus === 'Canceled' && !c.cancellationDate) updated.cancellationDate = new Date().toISOString();
                if (newStatus !== 'Canceled') updated.cancellationDate = null;
                return { ...c, ...updated };
            }
            return c;
        });
        setCandidates(updatedCandidates);
        logAction('Status do Candidato Atualizado', `Status de '${candidate.name}' alterado para '${statusTranslations[newStatus]}'.`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                    <Badge variant={statusVariants[currentStatus]} className="cursor-pointer">
                        {statusTranslations[currentStatus]}
                         <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                {Object.keys(statusTranslations).map(statusKey => (
                    <DropdownMenuItem 
                        key={statusKey}
                        onClick={(e) => handleStatusChange(e, statusKey as Candidate['status'])}
                        className="flex items-center justify-between"
                    >
                        {statusTranslations[statusKey]}
                        {currentStatus === statusKey && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const QuickActionsCell = ({ row }: { row: any }) => {
  const { templates } = useTemplates();
  const candidate = row.original as Candidate;

  const handleTemplateClick = (e: React.MouseEvent, templateContent: string) => {
    e.stopPropagation();
    const message = fillTemplate(templateContent, candidate);
    const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(candidate.phone)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex items-center justify-end">
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600">
                    <MessageSquare className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Enviar WhatsApp</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {templates.map(template => (
                    <DropdownMenuItem key={template.id} onClick={(e) => handleTemplateClick(e, template.content)}>
                        {template.name}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/${formatPhoneNumberForWhatsApp(candidate.phone)}`, '_blank');
                }}>
                    Mensagem Manual
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}

export const getColumns = (handleCopy: (text: string, subject: string) => void): ColumnDef<Candidate>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
        const c = row.original as Candidate;
        return (
            <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">{c.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase mt-0.5 font-mono">CÓD: {c.registrationCode}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
    cell: ({ row }) => <span className="text-xs tabular-nums">{row.getValue('phone')}</span>
  },
  {
    accessorKey: 'course',
    header: 'Curso',
    cell: ({ row }) => {
        const course = row.getValue('course') as string;
        return <span className="text-xs font-medium">{course}</span>
    }
  },
  {
    accessorKey: 'registrationDate',
    header: 'Inscrição',
    cell: ({ row }) => <span className="text-xs">{formatDateDisplay(row.getValue('registrationDate'))}</span>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: StatusCell,
  },
  {
    id: 'actions',
    cell: QuickActionsCell,
  },
];
