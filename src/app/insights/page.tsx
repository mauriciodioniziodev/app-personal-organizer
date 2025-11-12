
import PageHeader from "@/components/page-header";
import { ServiceRecommender } from "@/components/service-recommender";
import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";


export const maxDuration = 300; 

export default function RecommendationsPage() {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Oportunidades com IA" />
            <Suspense fallback={<div className="flex items-center justify-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>}>
                <ServiceRecommender />
            </Suspense>
        </div>
    )
}
