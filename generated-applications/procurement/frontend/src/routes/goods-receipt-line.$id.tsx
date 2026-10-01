import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/goods-receipt-line/$id')({
  component: GoodsReceiptLineDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GoodsReceiptLineDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="goods_receipt_line" recordId={id} />;
}
