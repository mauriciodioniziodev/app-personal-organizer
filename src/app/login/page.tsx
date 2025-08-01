
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { LoaderCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else if (signInError.message.includes('Email not confirmed')) {
             setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
        } else {
            setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
        }
        setLoading(false);
        return;
    }

    if (!user) {
        setError('Usuário não encontrado. Tente novamente.');
        setLoading(false);
        return;
    }

    // After successful authentication, check the user's profile status
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
    
    if(profileError) {
        setError('Não foi possível verificar seu perfil de usuário. Contate o suporte.');
        await supabase.auth.signOut(); // Log out user if profile can't be fetched
        setLoading(false);
        return;
    }

    if (profile?.status === 'authorized') {
        // The onAuthStateChange in RootLayout will handle the redirect
        router.push('/');
    } else {
        await supabase.auth.signOut(); // Log out user as they are not authorized
        if (profile?.status === 'revoked') {
            setError('Seu acesso foi revogado. Por favor, entre em contato com o administrador.');
        } else if (profile?.status === 'pending') {
            setError('Sua conta ainda está pendente de aprovação.');
        } else {
             setError('Seu acesso não está autorizado. Contate o administrador.');
        }
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Image 
                data-ai-hint="logo"
                src="https://placehold.co/80x80.png"
                width={80}
                height={80}
                alt="Logo Amanda Martins"
                className="rounded-lg"
            />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Bem-vindo(a) de volta!</CardTitle>
            <CardDescription>Acesse seu painel para gerenciar suas organizações.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Acesso Negado</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                 {loading ? <LoaderCircle className="animate-spin" /> : 'Entrar'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
