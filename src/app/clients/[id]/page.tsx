import { notFound } from "next/navigation";
import { getClientById, getProjectsByClientId } from "@/lib/data";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PreferenceAnalyzer from "@/components/client-preference-analyzer";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const client = getClientById(id);

  if (!client) {
    notFound();
  }

  const projects = getProjectsByClientId(client.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={client.name} />
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <span>{client.address}</span>
                    </div>
                </CardContent>
            </Card>

            <PreferenceAnalyzer clientName={client.name} clientDetails={client.preferences} />

        </div>
        
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <FolderKanban className="w-6 h-6"/>
                        Projetos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {projects.length > 0 ? (
                        <ul className="space-y-4">
                            {projects.map(project => (
                                <li key={project.id}>
                                    <Link href={`/projects/${project.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                        <h4 className="font-semibold">{project.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Status: <span className="capitalize font-medium">{project.paymentStatus}</span>
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">Nenhum projeto para este cliente.</p>
                    )}
                     <Link href="/projects/new" className="w-full">
                        <Button variant="outline" className="w-full mt-4">
                            Novo Projeto
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
