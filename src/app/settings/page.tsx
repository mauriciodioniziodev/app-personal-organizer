

"use client";

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { getSettings, updateSettings, getCurrentProfile } from '@/lib/data';
import type { CompanySettings, UserProfile } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoaderCircle, UploadCloud, Save, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const [currentSettings, currentProfile] = await Promise.all([
                getSettings(),
                getCurrentProfile()
            ]);
            
            setSettings(currentSettings);
            setProfile(currentProfile);

            if (currentSettings) {
                setCompanyName(currentSettings.companyName || '');
                setLogoPreview(currentSettings.logoUrl || null);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.svg'] },
        multiple: false,
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!profile?.companyId) {
             toast({
                variant: 'destructive',
                title: 'Erro de Autenticação',
                description: 'Não foi possível identificar sua empresa. Por favor, faça login novamente.',
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateSettings({ companyId: profile.companyId, companyName, logoFile });
            toast({
                title: 'Sucesso!',
                description: 'As configurações foram salvas.',
            });
            // Force reload to reflect changes globally
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: (error as Error).message,
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
        return (
           <div className="flex items-center justify-center h-full">
               <LoaderCircle className="w-8 h-8 animate-spin" />
           </div>
       );
     }


    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Configurações da Empresa" />
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Identidade Visual</CardTitle>
                        <CardDescription>Personalize a aparência do sistema com a sua marca.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nome da Empresa</Label>
                            <Input
                                id="companyName"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="Digite o nome da sua empresa"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logoUpload">Logomarca</Label>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'
                                }`}
                            >
                                <input {...getInputProps()} id="logoUpload" />
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <UploadCloud className="w-8 h-8" />
                                    {isDragActive ? (
                                        <p>Solte a imagem aqui...</p>
                                    ) : (
                                        <p>Arraste e solte a imagem aqui, ou clique para selecionar</p>
                                    )}
                                    <p className="text-xs">PNG, JPG, SVG ou GIF (recomendado 200x200px)</p>
                                </div>
                            </div>
                        </div>

                        {(logoPreview) && (
                            <div className="space-y-2">
                                <Label>Pré-visualização da Logo</Label>
                                <div className="p-4 bg-muted rounded-lg flex items-center justify-center">
                                    <Image src={logoPreview} alt="Pré-visualização da logo" width={160} height={160} className="object-contain" />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

    
