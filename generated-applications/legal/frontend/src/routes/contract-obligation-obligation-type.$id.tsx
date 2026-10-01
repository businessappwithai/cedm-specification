import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/contract-obligation-obligation-type/$id')({
  component: ContractObligationObligationTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContractObligationObligationTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="contract_obligation_obligation_type" recordId={id} />;
}
