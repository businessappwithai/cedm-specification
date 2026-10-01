import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-claim-resolution/$id')({
  component: SupplierClaimResolutionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierClaimResolutionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_claim_resolution" recordId={id} />;
}
