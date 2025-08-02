
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

import { LoaderCircle, Shirt } from 'lucide-react';

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

    if (!supabase) {
        setError('Ocorreu um erro de configuração. Tente novamente mais tarde.');
        setLoading(false);
        return;
    }

    // 1. Check user status by email before attempting to sign in.
    const { data: status, error: rpcError } = await supabase.rpc('get_user_status_by_email', { user_email: email });

    if (rpcError) {
        console.error('Error checking user status:', rpcError);
        // Don't block login if RPC fails, proceed to normal login attempt
    }

    if (status === 'revoked') {
        setError('Seu acesso foi revogado. Por favor, entre em contato com o administrador.');
        setLoading(false);
        return;
    }

    if (status === 'pending') {
        setError('Sua conta ainda está pendente de aprovação pelo administrador.');
        setLoading(false);
        return;
    }

    // 2. If status is ok, proceed with sign-in.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      setLoading(false);
      return;
    }

    // 3. If sign-in is successful, let the auth listener in layout handle the redirect.
    // The router.push is a fallback in case the listener is slow.
    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><Shirt className="w-20 h-20" /></div>
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
