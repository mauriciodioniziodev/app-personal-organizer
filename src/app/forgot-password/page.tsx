
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
import { LoaderCircle, MailCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!supabase) {
        setError('Ocorreu um erro de configuração. Tente novamente mais tarde.');
        setLoading(false);
        return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("For security purposes, you can only request this once every")) {
        setError('Um e-mail de redefinição já foi enviado. Por favor, verifique sua caixa de entrada e spam. Você poderá tentar novamente em alguns minutos.');
      } else {
        // We show a generic success message even if the user does not exist for security reasons
        setSuccess('Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.');
      }
    } else {
      setSuccess('Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Redefinir Senha</CardTitle>
            <CardDescription>
                {success 
                    ? "Verifique seu e-mail" 
                    : "Digite seu e-mail para receber o link de redefinição."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
                 <div className="space-y-4 text-center">
                    <MailCheck className="w-16 h-16 text-green-500 mx-auto" />
                    <Alert>
                        <AlertTitle>Link Enviado!</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para o Login
                        </Button>
                    </Link>
                 </div>
            ) : (
                <form onSubmit={handlePasswordReset} className="space-y-4">
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
                {error && (
                    <Alert variant="destructive">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <LoaderCircle className="animate-spin" /> : 'Enviar Link de Redefinição'}
                </Button>
                </form>
            )}
             <div className="mt-4 text-center text-sm">
              Lembrou sua senha?{' '}
              <Link href="/login" className="underline">
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
