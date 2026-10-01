import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/subscription-plan/$id')({
  component: SubscriptionPlanDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SubscriptionPlanDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="subscription_plan" recordId={id} />;
}
