
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { LoaderCircle, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';

function ResetPasswordComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const accessToken = searchParams.get('access_token');

  useEffect(() => {
    // This effect handles the initial verification of the token from the email link.
    // It is triggered by the onAuthStateChange listener in the layout when the user is redirected back from the email link.
    const handleAuthChange = async (_event: string, session: any) => {
        if (session && _event === 'SIGNED_IN') {
           // The user is signed in, which means the token was valid.
           // They can now set a new password.
        }
    };
    
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, []);


  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
    }
    
    if (!supabase) {
        setError('Ocorreu um erro de configuração. Tente novamente mais tarde.');
        setLoading(false);
        return;
    }
    
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Sua senha foi atualizada com sucesso!');
      // Sign out the user after password reset for security
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Definir Nova Senha</CardTitle>
             <CardDescription>
                {success 
                    ? "Sua senha foi redefinida!" 
                    : "Digite e confirme sua nova senha."
                }
            </CardDescription>
          </CardHeader>
          <CardContent>
             {success ? (
                 <div className="space-y-4 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <Alert variant="default" className="border-green-300">
                        <AlertTitle>Sucesso!</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Ir para o Login
                        </Button>
                    </Link>
                 </div>
            ) : (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nova Senha</Label>
                        <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? <LoaderCircle className="animate-spin" /> : 'Atualizar Senha'}
                    </Button>
                </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><LoaderCircle className="w-8 h-8 animate-spin" /></div>}>
            <ResetPasswordComponent />
        </Suspense>
    )
}
