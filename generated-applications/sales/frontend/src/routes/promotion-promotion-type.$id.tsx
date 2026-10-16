import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/promotion-promotion-type/$id')({
  component: PromotionPromotionTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PromotionPromotionTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="promotion_promotion_type" recordId={id} />;
}
