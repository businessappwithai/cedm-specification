import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-clause/$id')({
  component: ContractClauseDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractClauseDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_clause" recordId={id} />;
}
