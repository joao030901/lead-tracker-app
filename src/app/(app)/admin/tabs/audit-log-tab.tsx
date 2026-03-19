'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, History, FileClock } from 'lucide-react';
import { useAuditLog } from '@/context/audit-log-context';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AuditLogTab() {
    const { logs, clearLogs } = useAuditLog();
    const { toast } = useToast();

    const handleClearLogs = () => {
        clearLogs();
        toast({
            title: 'Logs Limpos',
            description: 'O histórico de auditoria foi completamente limpo.',
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-6 w-6" />
                            Logs de Auditoria
                        </CardTitle>
                        <CardDescription>Histórico de alterações importantes realizadas no sistema.</CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={logs.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Limpar Logs
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent aria-describedby={undefined}>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá apagar permanentemente todos os registros de auditoria.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearLogs}>Sim, apagar tudo</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {logs.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {logs.map((log) => (
                        <div key={log.id} className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 border rounded-lg bg-muted/30">
                            <FileClock className="h-4 w-4 sm:h-5 sm:w-5 mt-1 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{log.action}</p>
                                <p className="text-sm text-muted-foreground">{log.details}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    {new Date(log.date).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <p className="text-muted-foreground italic">Nenhum registro de auditoria encontrado.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
