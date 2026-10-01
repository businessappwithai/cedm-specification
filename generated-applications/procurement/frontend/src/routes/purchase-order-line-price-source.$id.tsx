import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/purchase-order-line-price-source/$id')({
  component: PurchaseOrderLinePriceSourceDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PurchaseOrderLinePriceSourceDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="purchase_order_line_price_source" recordId={id} />;
}
