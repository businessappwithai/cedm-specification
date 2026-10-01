import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/goods-receipt-status/$id')({
  component: GoodsReceiptStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GoodsReceiptStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="goods_receipt_status" recordId={id} />;
}
