import { assertSection } from "@/lib/rbac";
import { getDespacts } from "@/lib/despact-queries";
import DespactList from "../../_components/DespactList";

export const dynamic = "force-dynamic";

export default async function ProductionDespactPage() {
    await assertSection("production");
    const despacts = await getDespacts({ includePrices: false });
    return (
        <div className="min-h-screen bg-macos-base p-6">
            <div className="mx-auto max-w-7xl space-y-4">
                <h1 className="text-xl font-semibold text-macos-primary">
                    Job Despact: Production
                </h1>
                <DespactList despacts={despacts} mode="production" />
            </div>
        </div>
    );
}