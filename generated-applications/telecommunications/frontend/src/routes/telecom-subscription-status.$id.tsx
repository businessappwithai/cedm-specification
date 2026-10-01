import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/telecom-subscription-status/$id')({
  component: TelecomSubscriptionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TelecomSubscriptionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="telecom_subscription_status" recordId={id} />;
}
