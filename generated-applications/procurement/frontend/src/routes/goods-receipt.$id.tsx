import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/goods-receipt/$id')({
  component: GoodsReceiptDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function GoodsReceiptDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="goods_receipt" recordId={id} />;
}
