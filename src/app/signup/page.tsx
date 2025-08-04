
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

    // This simply creates the user in auth.users.
    // A database trigger (`on_auth_user_created`) will then create the company,
    // the profile (as admin), and the default settings for that company.
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // This will be used as the company and user name
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    if (!user) {
        setError("Não foi possível criar o usuário. Tente novamente.");
        setLoading(false);
        return;
    }
    
    // The trigger handles all the backend setup. We just notify the user.
    try {
        await notifyAdminOfNewUser({ userName: `${fullName} (Empresa: ${fullName})` });
        setSuccess('Cadastro realizado com sucesso! Você já pode acessar sua conta e começar a usar o sistema.');
    } catch (notificationError: any) {
        console.error("Failed to send notification:", notificationError);
         setSuccess('Cadastro realizado com sucesso! Ocorreu um erro ao notificar o super-administrador, mas sua conta está pronta para uso.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Crie sua Conta e sua Empresa</CardTitle>
            <CardDescription>Preencha os campos para criar seu acesso de administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
                 <Alert>
                  <AlertTitle>Sucesso!</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                  <div className="mt-4">
                    <Link href="/login">
                        <Button className="w-full">Ir para o Login</Button>
                    </Link>
                  </div>
                </Alert>
            ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome da Empresa / Seu Nome Completo</Label>
                        <Input
                        id="fullName"
                        type="text"
                        placeholder="Ex: OrganizaTudo Ltda"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Seu E-mail de Administrador</Label>
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
                        <Label htmlFor="password">Sua Senha</Label>
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
                        {loading ? <LoaderCircle className="animate-spin" /> : 'Criar Minha Conta e Empresa'}
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

    