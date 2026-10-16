import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-renewal-renewal-type/$id')({
  component: ContractRenewalRenewalTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractRenewalRenewalTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_renewal_renewal_type" recordId={id} />;
}
