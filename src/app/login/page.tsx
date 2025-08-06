
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

  useEffect(() => {
    // Check for error messages passed via query params from the layout redirect
    const searchParams = new URLSearchParams(window.location.search);
    const authError = searchParams.get('error');
    if (authError) {
      setError(decodeURIComponent(authError));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
        setError('Ocorreu um erro de configuração. Tente novamente mais tarde.');
        setLoading(false);
        return;
    }
    
    // The logic has been simplified to directly use Supabase auth.
    // The check for company status and user status will happen in the RootLayout after a successful login.
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
        } else {
            setError(signInError.message);
        }
        setLoading(false);
        return;
    }
    
    if (!user) {
        setError("Ocorreu um erro inesperado durante o login. Tente novamente.");
        setLoading(false);
        return;
    }

    // On successful login, clear any previous errors and redirect to the dashboard.
    // The RootLayout will handle the authorization checks.
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

    
