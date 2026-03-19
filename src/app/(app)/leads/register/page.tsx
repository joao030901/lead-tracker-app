'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLeads } from '@/context/leads-context';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { Lead } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listLocations } from '@/lib/actions';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function LeadRegistrationPage() {
    const { setLeads } = useLeads();
    const { toast } = useToast();
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [course, setCourse] = useState('');
    const [unit, setUnit] = useState('');
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    
    useEffect(() => {
        async function fetchUnits() {
            const units = await listLocations();
            setAvailableUnits(units);
        }
        fetchUnits();
    }, []);

    const formatLocationName = (name: string) => {
        return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !phone || !course || !unit) {
            toast({
                variant: 'destructive',
                title: 'Campos Incompletos',
                description: 'Por favor, preencha todos os campos obrigatórios.',
            });
            return;
        }

        const newLead: Lead = {
            id: uuidv4(),
            name,
            email,
            phone,
            cpf: null,
            course,
            unit,
            status: 'new',
            createdAt: new Date().toISOString(),
        };

        setLeads(prevLeads => [...prevLeads, newLead]);

        toast({
            title: 'Inscrição Realizada!',
            description: 'Obrigado por se inscrever. Entraremos em contato em breve!',
        });
        
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setCourse('');
        setUnit('');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-lg relative">
                <CardHeader className="text-center">
                    <Button asChild variant="ghost" size="icon" className="absolute top-4 right-4">
                        <Link href="/leads">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Fechar</span>
                        </Link>
                    </Button>
                    <div className="mx-auto bg-primary p-4 rounded-lg inline-block">
                       <Logo />
                    </div>
                    <CardTitle className="text-2xl pt-4">Inscreva-se</CardTitle>
                    <CardDescription>Preencha o formulário abaixo para dar o primeiro passo na sua jornada educacional.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="course">Curso de Interesse</Label>
                            <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Ex: Ciência da Computação" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="unit">Unidade Mais Próxima</Label>
                             <Select onValueChange={setUnit} value={unit}>
                                <SelectTrigger id="unit" required>
                                    <SelectValue placeholder="Selecione a unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUnits.map(unitName => (
                                        <SelectItem key={unitName} value={unitName}>
                                            {formatLocationName(unitName)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full !mt-6" size="lg">Quero me Inscrever!</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
