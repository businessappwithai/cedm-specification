import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/supplier-claim/$id')({
  component: SupplierClaimDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SupplierClaimDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="supplier_claim" recordId={id} />;
}
