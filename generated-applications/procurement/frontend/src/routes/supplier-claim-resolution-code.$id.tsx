import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-claim-resolution-code/$id')({
  component: SupplierClaimResolutionCodeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierClaimResolutionCodeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_claim_resolution_code" recordId={id} />;
}
