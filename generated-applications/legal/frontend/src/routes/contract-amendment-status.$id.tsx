import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-amendment-status/$id')({
  component: ContractAmendmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractAmendmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_amendment_status" recordId={id} />;
}
