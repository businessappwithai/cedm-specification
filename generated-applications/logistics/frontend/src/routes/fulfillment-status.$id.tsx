import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/fulfillment-status/$id')({
  component: FulfillmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FulfillmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="fulfillment_status" recordId={id} />;
}
