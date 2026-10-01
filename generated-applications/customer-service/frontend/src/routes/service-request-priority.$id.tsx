import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-request-priority/$id')({
  component: ServiceRequestPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceRequestPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_request_priority" recordId={id} />;
}
