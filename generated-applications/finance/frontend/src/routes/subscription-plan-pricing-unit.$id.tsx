import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/subscription-plan-pricing-unit/$id')({
  component: SubscriptionPlanPricingUnitDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SubscriptionPlanPricingUnitDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="subscription_plan_pricing_unit" recordId={id} />;
}
