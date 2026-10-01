import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/discount-rule/$id')({
  component: DiscountRuleDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DiscountRuleDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="discount_rule" recordId={id} />;
}
