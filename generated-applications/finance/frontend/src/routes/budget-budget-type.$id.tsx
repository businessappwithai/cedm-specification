import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/budget-budget-type/$id')({
  component: BudgetBudgetTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BudgetBudgetTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="budget_budget_type" recordId={id} />;
}
