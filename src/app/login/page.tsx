'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Sucesso",
        description: "Bem-vindo de volta!",
      });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro no Login",
        description: "E-mail ou senha inválidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] relative overflow-hidden">
      {/* Dynamic Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
      
      <Card className="w-full max-w-md mx-4 bg-black/40 border-white/10 backdrop-blur-xl shadow-2xl relative z-10 transition-all hover:border-primary/30">
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <Lock className="text-primary w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">LeadsUni</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Entre com suas credenciais para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">E-mail</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">Senha</Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 h-12 bg-white/5 border-white/10 text-white focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Acessar Sistema'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-8 text-center w-full text-sm text-muted-foreground/50">
        &copy; 2024 LeadsUni Management Platform
      </div>
    </div>
  );
}
