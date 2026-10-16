import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/fulfillment-priority/$id')({
  component: FulfillmentPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FulfillmentPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="fulfillment_priority" recordId={id} />;
}
