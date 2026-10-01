import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/purchase-order-line/$id')({
  component: PurchaseOrderLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PurchaseOrderLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="purchase_order_line" recordId={id} />;
}
