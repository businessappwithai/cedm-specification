import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/discount-rule-method/$id')({
  component: DiscountRuleMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DiscountRuleMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="discount_rule_method" recordId={id} />;
}
