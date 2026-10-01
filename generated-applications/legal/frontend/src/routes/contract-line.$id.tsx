import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-line/$id')({
  component: ContractLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_line" recordId={id} />;
}
