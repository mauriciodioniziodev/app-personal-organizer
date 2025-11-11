
"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients, getClientSources } from "@/lib/data";
import { PlusCircle, Mail, Phone, Search, LoaderCircle, Share2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import type { Client, ClientSource } from "@/lib/definitions";
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardBody } from 'react-bootstrap';


const CLIENTS_PER_PAGE = 20;

export default function ClientsPage() {
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientSources, setClientSources] = useState<ClientSource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchClients() {
        setLoading(true);
        const [clientsData, sourcesData] = await Promise.all([
          getClients(),
          getClientSources()
        ]);
        const sortedClients = clientsData.sort((a, b) => a.name.localeCompare(b.name));
        setAllClients(sortedClients);
        setFilteredClients(sortedClients);
        setClientSources(sourcesData);
        setLoading(false);
    }
    fetchClients();
  }, []);


  useEffect(() => {
    let results = allClients.filter(client => {
      const searchMatch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const sourceMatch = sourceFilter === 'all' || (client.source || 'Não especificado') === sourceFilter;
      return searchMatch && sourceMatch;
    });
    setFilteredClients(results);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, sourceFilter, allClients]);

  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
      (currentPage - 1) * CLIENTS_PER_PAGE,
      currentPage * CLIENTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  if (loading) {
     return (
        <div className="flex items-center justify-center h-full">
            <LoaderCircle className="w-8 h-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Clientes">
        <Link href="/clients/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </Link>
      </PageHeader>
      
      <Card>
          <CardHeader>
              <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="w-full space-y-2">
              <Label htmlFor='search-term'>Nome do Cliente</Label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-term"
                  type="text"
                  placeholder="Filtrar por nome..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full space-y-2">
                <Label htmlFor='source-filter'>Origem do Cliente</Label>
                 <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger id="source-filter">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Origens</SelectItem>
                        {clientSources.map(source => (
                            <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                        ))}
                         <SelectItem value="Não especificado">Não especificado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
      </Card>
      
      {paginatedClients.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedClients.map((client) => (
              <Card key={client.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-headline">{client.name}</CardTitle>
                  <CardDescription className='space-y-2'>
                      <div className="flex items-center gap-2 mt-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{client.phone}</span>
                      </div>
                       {client.source && (
                        <div className="flex items-center gap-2 pt-1 text-xs">
                          <Share2 className="w-3 h-3 text-muted-foreground"/>
                          <span className="text-muted-foreground font-medium">{client.source}</span>
                        </div>
                      )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">{client.preferences || "Nenhuma preferência registrada."}</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/clients/${client.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      Ver Detalhes
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
             <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} aria-disabled={currentPage === 1}/>
                  </PaginationItem>
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                            <PaginationLink href="#" onClick={(e) => {e.preventDefault(); handlePageChange(page)}} isActive={currentPage === page}>
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} aria-disabled={currentPage === totalPages}/>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <h2 className="text-2xl font-headline">Nenhum cliente encontrado</h2>
            <p className="text-muted-foreground mt-2 mb-4">
              {allClients.length > 0 ? 'Tente um termo de busca diferente.' : 'Comece adicionando seu primeiro cliente.'}
            </p>
            {allClients.length === 0 && (
                <Link href="/clients/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Cliente
                    </Button>
                </Link>
            )}
        </div>
      )}
    </div>
  );
}
