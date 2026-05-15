
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
import type { Lead, Candidate } from '@/lib/types';
import { useLeads } from '@/context/leads-context';
import { useAuditLog } from '@/context/audit-log-context';
import { cn, formatDateDisplay, formatPhoneNumberForWhatsApp, fillTemplate } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { useTemplates } from '@/context/templates-context';

const statusTranslations: { [key: string]: string } = {
  'new': 'Novo',
  'contacted': 'Contatado',
  'converted': 'Convertido',
  'discarded': 'Descartado',
};

const statusVariants: { [key: string]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  new: 'outline',
  contacted: 'secondary',
  converted: 'default',
  discarded: 'destructive',
};

const StatusCell = ({ row, onConvertClick }: { row: any, onConvertClick: (lead: Lead) => void }) => {
    const { leads, setLeads } = useLeads();
    const { logAction } = useAuditLog();
    const lead = row.original as Lead;
    const currentStatus = lead.status;
    
    const handleStatusChange = (e: React.MouseEvent, newStatus: Lead['status']) => {
        e.stopPropagation();

        if (newStatus === 'converted') {
            onConvertClick(lead);
            return;
        }

        const updatedLeads = leads.map(l => l.id === lead.id ? { ...l, status: newStatus } : l);
        setLeads(updatedLeads);
        logAction('Status do Lead Atualizado', `Status do lead '${lead.name}' alterado para '${statusTranslations[newStatus]}'.`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" className="p-0 h-auto">
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
                        onClick={(e) => handleStatusChange(e, statusKey as Lead['status'])}
                        disabled={currentStatus === statusKey}
                    >
                       <Check className={cn("mr-2 h-4 w-4", currentStatus === statusKey ? "opacity-100" : "opacity-0")} />
                        {statusTranslations[statusKey]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const QuickActionsCell = ({ row }: { row: any }) => {
  const { templates } = useTemplates();
  const lead = row.original as Lead;

  const handleTemplateClick = (e: React.MouseEvent, templateContent: string) => {
    e.stopPropagation();
    const message = fillTemplate(templateContent, lead as unknown as Candidate);
    const whatsappUrl = `https://wa.me/${formatPhoneNumberForWhatsApp(lead.phone)}?text=${encodeURIComponent(message)}`;
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
                {templates.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://wa.me/${formatPhoneNumberForWhatsApp(lead.phone)}`, '_blank');
                }}>
                    Mensagem Manual
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}

export const columns = (onConvertClick: (lead: Lead) => void): ColumnDef<Lead>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
        const l = row.original as Lead;
        return (
            <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">{l.name}</span>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 font-mono w-fit whitespace-nowrap uppercase">
                    CRIADO: {formatDateDisplay(l.createdAt)}
                </span>
            </div>
        )
    }
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
    cell: ({ row }) => <span className="text-xs">{row.getValue('phone')}</span>
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
    accessorKey: 'createdAt',
    header: 'Criação',
    cell: ({ row }) => <span className="text-xs">{formatDateDisplay(row.getValue('createdAt'))}</span>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (props) => <StatusCell {...props} onConvertClick={onConvertClick} />,
  },
   {
    id: 'actions',
    cell: QuickActionsCell,
  },
];
