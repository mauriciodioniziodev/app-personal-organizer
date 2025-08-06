

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { LoaderCircle, Shirt } from 'lucide-react';
import type { CompanySettings } from '@/lib/definitions';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Company settings cannot be reliably fetched on login page without knowing the company.
  // We will display a generic welcome message. The logo/name will appear after login.
  const companyName = 'Bem-vindo(a) de volta!';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
        setError('Ocorreu um erro de configuração. Tente novamente mais tarde.');
        setLoading(false);
        return;
    }
    
    // Step 1: Check user and company status BEFORE attempting to sign in.
    const { data: status, error: rpcError } = await supabase.rpc('get_user_and_company_status', { p_email: email });

    if (rpcError) {
      // This could happen if the user doesn't exist. We want to show a generic "Invalid credentials" error.
      // So we'll try to sign in anyway, and let that fail.
      console.warn('RPC get_user_and_company_status failed, proceeding to login attempt:', rpcError.message);
    } else if (status) {
        // Step 2: Evaluate the status returned by the RPC function.
        if (status.company_is_active === false) {
            setError('O acesso da sua empresa ao sistema foi suspenso. Por favor, entre em contato com o suporte.');
            setLoading(false);
            return;
        }

        if (status.user_status === 'revoked') {
            setError('Seu acesso foi revogado. Por favor, entre em contato com o administrador.');
            setLoading(false);
            return;
        }

        if (status.user_status === 'pending') {
            setError('Sua conta ainda está pendente de aprovação pelo administrador.');
            setLoading(false);
            return;
        }
    }
    
    // Step 3: If all checks pass, proceed with the actual authentication.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      setLoading(false);
      return;
    }

    router.push('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-card border">
                <Shirt className="w-10 h-10 text-muted-foreground" />
            </div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">{companyName}</CardTitle>
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
                 <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                     <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Esqueceu sua senha?
                    </Link>
                 </div>
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
