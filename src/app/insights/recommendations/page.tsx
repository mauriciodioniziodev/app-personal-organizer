

"use client";

import { useEffect, useState } from 'react';
import PageHeader from "@/components/page-header";
import { LoaderCircle, Lightbulb, ArrowLeft } from "lucide-react";
import ServiceRecommender from '@/components/service-recommender';
import { getClients, getProjects } from '@/lib/data';
import type { Client, Project } from '@/lib/definitions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RecommendationsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [clientsData, projectsData] = await Promise.all([
                getClients(),
                getProjects(),
            ]);
            setClients(clientsData);
            setProjects(projectsData);
            setLoading(false);
        }
        loadData();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Recomendação de Serviços">
                <Link href="/insights">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
                </Link>
            </PageHeader>
            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <LoaderCircle className="animate-spin text-primary w-10 h-10"/>
                </div>
            ) : (
                <ServiceRecommender allClients={clients} allProjects={projects} />
            )}
        </div>
    );
}
