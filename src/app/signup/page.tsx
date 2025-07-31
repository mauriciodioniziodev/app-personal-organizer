
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
import { notifyAdminOfNewUser } from '@/ai/flows/user-notification';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // This simply creates the user in auth.users. The Supabase trigger will create the profile.
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!user) {
        setError("Não foi possível criar o usuário. Tente novamente.");
        setLoading(false);
        return;
    }

    // Notify admin that a new user has signed up
    try {
        await notifyAdminOfNewUser({ userName: fullName });
        setSuccess('Cadastro realizado com sucesso! Sua conta está pendente de aprovação pelo administrador. Você será notificado por e-mail quando seu acesso for liberado.');
        await supabase.auth.signOut(); // Log out user until they are approved
    } catch (notificationError) {
        console.error("Failed to send admin notification email, but user was created:", notificationError);
        // Don't block user creation if email fails, show a slightly different message
        setSuccess('Cadastro realizado com sucesso! Sua conta está pendente de aprovação. Ocorreu um erro ao notificar o administrador, por favor entre em contato diretamente.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
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
            <CardTitle className="text-2xl font-headline">Crie sua Conta</CardTitle>
            <CardDescription>Preencha os campos para solicitar seu acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
                 <Alert>
                  <AlertTitle>Sucesso!</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                  <div className="mt-4">
                    <Link href="/login">
                        <Button className="w-full">Voltar para o Login</Button>
                    </Link>
                  </div>
                </Alert>
            ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo</Label>
                        <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        />
                    </div>
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
                        placeholder="Mínimo de 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                    </div>
                    {error && (
                        <Alert variant="destructive">
                        <AlertTitle>Erro no Cadastro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <LoaderCircle className="animate-spin" /> : 'Criar Conta'}
                    </Button>
                </form>
            )}
            
            {!success && (
                <div className="mt-4 text-center text-sm">
                Já tem uma conta?{' '}
                <Link href="/login" className="underline">
                    Faça login
                </Link>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
