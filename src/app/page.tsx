'use client';

import { useRouter } from 'next/navigation';
import { useLocation } from '@/context/location-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, PlusCircle, Settings, Trash2, Loader2, Edit, Save, X } from 'lucide-react';
import { addLocation, deleteLocation, listLocations, updateLocation } from '@/lib/actions';
import { useEffect, useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function LocationSelectionPage() {
  const router = useRouter();
  const { location, setLocation } = useLocation();
  const [locations, setLocations] = useState<string[]>([]);
  const [manageMode, setManageMode] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [isPending, startTransition] = useTransition();
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState('');

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
        const fetchedLocations = await listLocations();
        setLocations(fetchedLocations);
    } catch (error) {
        console.error("Failed to fetch locations:", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      router.push('/dashboard');
    } else {
        fetchLocations();
    }
  }, [location, router]);

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
    router.push('/dashboard');
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
        toast({ title: 'Erro', description: 'O nome da unidade não pode ser vazio.', variant: 'destructive'});
        return;
    }
    startTransition(async () => {
        try {
            const formattedName = newLocationName.trim().toLowerCase().replace(/\s+/g, '_');
            await addLocation(formattedName);
            await fetchLocations(); // Re-fetch locations
            setNewLocationName('');
            toast({ title: 'Sucesso', description: `Unidade "${newLocationName}" adicionada.`});
        } catch (error) {
            toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive'});
        }
    });
  }
  
  const handleEditClick = (loc: string) => {
    setEditingLocation(loc);
    setEditingLocationName(formatLocationName(loc));
  }
  
  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditingLocationName('');
  }

  const handleUpdateLocation = () => {
      if (!editingLocation || !editingLocationName.trim()) {
          toast({ title: 'Erro', description: 'O nome da unidade não pode ser vazio.', variant: 'destructive'});
          return;
      }
      startTransition(async () => {
        try {
            const formattedNewName = editingLocationName.trim().toLowerCase().replace(/\s+/g, '_');
            await updateLocation(editingLocation, formattedNewName);
            await fetchLocations(); // Re-fetch locations
            toast({ title: 'Sucesso', description: 'Nome da unidade atualizado.' });
        } catch (error) {
            toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' });
        } finally {
            handleCancelEdit();
        }
      });
  }

  const handleDeleteLocation = () => {
    if (!locationToDelete) return;
     startTransition(async () => {
        try {
            await deleteLocation(locationToDelete);
            await fetchLocations(); // Re-fetch locations
            toast({ title: 'Sucesso', description: `Unidade "${formatLocationName(locationToDelete)}" removida.`});
        } catch (error) {
            toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive'});
        } finally {
            setLocationToDelete(null);
        }
    });
  }

  const formatLocationName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  if (isLoading || location) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <AlertDialog open={!!locationToDelete} onOpenChange={(isOpen) => !isOpen && setLocationToDelete(null)}>
        <AlertDialogContent aria-describedby={undefined}>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá deletar permanentemente a unidade e todos os seus dados.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation} disabled={isPending}>
                {isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Selecione a Unidade</CardTitle>
          <CardDescription>Escolha a unidade que você deseja gerenciar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {locations.map((loc) => (
            <div key={loc} className="flex flex-col gap-2">
                {editingLocation === loc ? (
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label htmlFor="edit-location-name" className="text-sm font-medium">Editar nome</label>
                            <Input id="edit-location-name" value={editingLocationName} onChange={e => setEditingLocationName(e.target.value)} disabled={isPending}/>
                        </div>
                        <Button onClick={handleUpdateLocation} disabled={isPending} size="icon"><Save className="h-5 w-5" /></Button>
                        <Button variant="ghost" onClick={handleCancelEdit} disabled={isPending} size="icon"><X className="h-5 w-5" /></Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            size="lg"
                            className="w-full justify-start text-base py-8"
                            onClick={() => handleLocationSelect(loc)}
                        >
                            <Building className="mr-4 h-6 w-6" />
                            {formatLocationName(loc)}
                        </Button>
                        {manageMode && (
                             <div className="flex flex-col gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleEditClick(loc)} disabled={isPending}>
                                    <Edit className="h-5 w-5" />
                                </Button>
                                <Button variant="destructive" size="icon" onClick={() => setLocationToDelete(loc)} disabled={isPending}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
          ))}

          {manageMode && (
            <div className="flex items-end gap-2 pt-4 border-t">
                <div className="flex-1">
                    <label htmlFor="new-location-name" className="text-sm font-medium">Nova Unidade</label>
                    <Input id="new-location-name" placeholder="Nome da cidade" value={newLocationName} onChange={e => setNewLocationName(e.target.value)} disabled={isPending} />
                </div>
                <Button onClick={handleAddLocation} disabled={isPending}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
            </div>
          )}

        </CardContent>
         <div className="p-4 border-t flex justify-end">
            <Button variant={manageMode ? "default" : "outline"} onClick={() => { setManageMode(!manageMode); handleCancelEdit(); }}>
                <Settings className="mr-2 h-4 w-4" />
                {manageMode ? 'Concluir' : 'Gerenciar Unidades'}
            </Button>
        </div>
      </Card>
    </div>
    </>
  );
}
