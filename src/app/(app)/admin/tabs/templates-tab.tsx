
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Check, Edit, X } from 'lucide-react';
import type { MessageTemplate } from '@/lib/types';
import { useTemplates } from '@/context/templates-context';
import { Textarea } from '@/components/ui/textarea';
import { useAuditLog } from '@/context/audit-log-context';
import { Input } from '@/components/ui/input';

export default function TemplatesTab() {
    const { templates, setTemplates } = useTemplates();
    const { logAction } = useAuditLog();
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState('');
    const [editingTemplateContent, setEditingTemplateContent] = useState('');
    const { toast } = useToast();

    const handleAddTemplate = () => {
        if (!newTemplateName.trim() || !newTemplateContent.trim()) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'O nome e o conteúdo do modelo são obrigatórios.',
            });
            return;
        }
        const newTemplate: MessageTemplate = {
            id: uuidv4(),
            name: newTemplateName.trim(),
            content: newTemplateContent.trim(),
        };
        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        logAction('Modelo de Mensagem Criado', `Adicionado novo modelo: "${newTemplate.name}"`);
        setNewTemplateName('');
        setNewTemplateContent('');
        toast({
            title: 'Modelo Adicionado',
            description: 'Novo modelo de mensagem foi salvo.',
        });
    };

    const handleRemoveTemplate = (id: string) => {
        const templateToRemove = templates.find(t => t.id === id);
        if (!templateToRemove) return;
        const updatedTemplates = templates.filter(t => t.id !== id);
        setTemplates(updatedTemplates);
        logAction('Modelo de Mensagem Removido', `Removido modelo: "${templateToRemove.name}"`);
        toast({
            title: 'Modelo Removido',
            description: 'O modelo de mensagem foi removido.',
        });
    };

    const startEditing = (template: MessageTemplate) => {
        setEditingTemplateId(template.id);
        setEditingTemplateName(template.name);
        setEditingTemplateContent(template.content);
    };

    const cancelEditing = () => {
        setEditingTemplateId(null);
        setEditingTemplateName('');
        setEditingTemplateContent('');
    };

    const handleSaveEdit = (id: string) => {
        if (!editingTemplateName.trim() || !editingTemplateContent.trim()) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'O nome e o conteúdo do modelo não podem estar vazios.',
            });
            return;
        }
        const updatedTemplates = templates.map(t =>
            t.id === id ? { ...t, name: editingTemplateName.trim(), content: editingTemplateContent.trim() } : t
        );
        setTemplates(updatedTemplates);
        logAction('Modelo de Mensagem Atualizado', `Atualizado modelo: "${editingTemplateName.trim()}"`);
        toast({
            title: 'Modelo Atualizado',
            description: 'O modelo de mensagem foi atualizado.',
        });
        cancelEditing();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Modelos de Mensagem</CardTitle>
                <CardDescription>Crie e gerencie modelos de mensagem para o WhatsApp. Use `{`{nome_candidato}`}` e `{`{curso_candidato}`}` para variáveis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {templates.map(template => (
                    <div key={template.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-4">
                        {editingTemplateId === template.id ? (
                            <div className="flex w-full flex-col gap-2 flex-1">
                                <Input
                                    value={editingTemplateName}
                                    onChange={(e) => setEditingTemplateName(e.target.value)}
                                    placeholder="Nome do Modelo"
                                />
                                <Textarea
                                    value={editingTemplateContent}
                                    onChange={(e) => setEditingTemplateContent(e.target.value)}
                                    className="flex-1"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(template.id)}>
                                        <Check className="h-5 w-5 text-green-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={cancelEditing}>
                                        <X className="h-5 w-5 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{template.name}</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.content}</p>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center">
                                    <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                                        <Edit className="h-4 w-4 sm:mr-2" />
                                        <span className='hidden sm:inline'>Editar</span>
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleRemoveTemplate(template.id)}>Remover</Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t">
                    <Label htmlFor="new-template-name">Novo Modelo de Mensagem</Label>
                    <Input
                        id="new-template-name"
                        placeholder="Nome do Modelo (ex: Contato Inicial)"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                    <Textarea
                        id="new-template"
                        placeholder="Olá {nome_candidato}, vi seu interesse no curso de {curso_candidato}..."
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddTemplate} className="mt-2">Adicionar Modelo</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
