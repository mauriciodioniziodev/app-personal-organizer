
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

    // A lógica de autenticação é simplificada.
    // O onAuthStateChange no RootLayout será o único responsável por
    // verificar o status do perfil e redirecionar o usuário.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
        // A maioria dos erros de login se enquadra em 'Invalid login credentials'.
        // Personalizamos a mensagem para ser mais clara ao usuário.
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
    
    // Se o login for bem-sucedido, o listener no RootLayout cuidará do resto.
    // Apenas redirecionamos para o dashboard. Se o usuário não for autorizado,
    // o RootLayout o redirecionará de volta para o login.
    router.push('/');
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
