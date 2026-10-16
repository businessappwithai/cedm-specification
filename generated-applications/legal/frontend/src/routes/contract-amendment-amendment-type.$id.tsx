import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-amendment-amendment-type/$id')({
  component: ContractAmendmentAmendmentTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractAmendmentAmendmentTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_amendment_amendment_type" recordId={id} />;
}
