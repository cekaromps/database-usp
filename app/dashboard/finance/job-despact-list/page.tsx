import { assertSection } from "@/lib/rbac";
import { getDespacts } from "@/lib/despact-queries";
import DespactList from "../../_components/DespactList";

export const dynamic = "force-dynamic";

export default async function FinanceDespactPage() {
  await assertSection("finance");
  const despacts = await getDespacts({ includePrices: true });

return (
  <div className="min-h-screen bg-macos-base p-6">
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-xl font-semibold text-macos-primary">
        Job Despact: Finance
      </h1>
      <DespactList despacts={despacts} mode="finance" />
    </div>
  </div>
);
}