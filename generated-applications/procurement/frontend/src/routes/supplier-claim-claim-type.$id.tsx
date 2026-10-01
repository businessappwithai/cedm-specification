import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-claim-claim-type/$id')({
  component: SupplierClaimClaimTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierClaimClaimTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_claim_claim_type" recordId={id} />;
}
