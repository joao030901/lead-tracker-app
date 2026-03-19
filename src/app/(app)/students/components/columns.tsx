'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Copy, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Student } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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

export const getColumns = (
    handleCopy: (text: string, subject: string) => void,
    onDelete: (id: string) => void
): ColumnDef<Student>[] => [
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
        const student = row.original as Student;
        return (
            <div className="flex flex-col">
                <span className="font-semibold text-sm leading-tight">{student.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase mt-0.5 font-mono">MAT: {student.id}</span>
            </div>
        )
    }
  },
  {
    accessorKey: 'courseName',
    header: 'Curso',
    cell: ({ row }) => <span className="text-xs font-medium">{row.getValue('courseName')}</span>
  },
  {
    accessorKey: 'cellphone',
    header: 'Celular',
    cell: ({ row }) => <span className="text-xs tabular-nums">{row.getValue('cellphone')}</span>
  },
  {
    accessorKey: 'studentSituation',
    header: 'Situação',
    cell: ({ row }) => <span className="text-xs">{row.getValue('studentSituation')}</span>
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return <Badge variant={isActive ? 'default' : 'destructive'} className='text-[10px] py-0 px-2'>{isActive ? 'Ativo' : 'Inativo'}</Badge>
    },
  },
   {
    id: 'actions',
    cell: ({ row }) => {
        const student = row.original;
        return (
            <div className="flex justify-end">
                <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopy(student.id, 'Matrícula'); }}>
                        <Copy className="mr-2 h-4 w-4" /> Copiar Matrícula
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive font-semibold">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Aluno
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent aria-describedby={undefined} onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir {student.name}?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(student.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        )
    },
  },
];
