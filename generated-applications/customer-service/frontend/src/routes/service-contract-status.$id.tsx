import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-contract-status/$id')({
  component: ServiceContractStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceContractStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_contract_status" recordId={id} />;
}
