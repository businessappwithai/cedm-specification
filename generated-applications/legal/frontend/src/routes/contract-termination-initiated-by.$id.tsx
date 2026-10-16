import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-termination-initiated-by/$id')({
  component: ContractTerminationInitiatedByDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractTerminationInitiatedByDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_termination_initiated_by" recordId={id} />;
}
