import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-claim-resolution-status/$id')({
  component: SupplierClaimResolutionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierClaimResolutionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_claim_resolution_status" recordId={id} />;
}
