
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
import { LoaderCircle } from 'lucide-react';
import { notifyAdminOfNewUser } from '@/ai/flows/user-notification';
import { getActiveOrganizations } from '@/lib/data';
import type { Company } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [organizations, setOrganizations] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  useEffect(() => {
    async function fetchOrgs() {
      setLoadingOrgs(true);
      const orgs = await getActiveOrganizations();
      setOrganizations(orgs);
      setLoadingOrgs(false);
    }
    fetchOrgs();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    if (!companyId) {
        setError("Por favor, selecione a sua empresa.");
        setLoading(false);
        return;
    }

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_id: companyId,
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
    
    try {
        const selectedCompany = organizations.find(o => o.id === companyId);
        await notifyAdminOfNewUser({ userName: `${fullName} (Empresa: ${selectedCompany?.name || 'N/A'})` });
        setSuccess('Cadastro realizado com sucesso! Um administrador da sua empresa precisa aprovar seu acesso. Você será notificado por e-mail.');
    } catch (notificationError: any) {
        console.error("Failed to send notification:", notificationError);
         setSuccess('Cadastro realizado com sucesso! Um administrador da sua empresa precisa aprovar seu acesso.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Criar sua Conta</CardTitle>
            <CardDescription>Preencha os campos para criar seu acesso.</CardDescription>
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
                        <Label htmlFor="companyId">Empresa</Label>
                        <Select name="companyId" required value={companyId} onValueChange={setCompanyId}>
                          <SelectTrigger disabled={loadingOrgs}>
                            <SelectValue placeholder={loadingOrgs ? "Carregando empresas..." : "Selecione sua empresa"} />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.length > 0 ? (
                              organizations.map(org => (
                                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-sm text-muted-foreground">Nenhuma empresa encontrada.</div>
                            )}
                          </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Seu Nome Completo</Label>
                        <Input
                        id="fullName"
                        type="text"
                        placeholder="Ex: Ana de Souza"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Seu E-mail</Label>
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
                    <Button type="submit" className="w-full" disabled={loading || loadingOrgs}>
                        {loading ? <LoaderCircle className="animate-spin" /> : 'Criar Minha Conta'}
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

    
