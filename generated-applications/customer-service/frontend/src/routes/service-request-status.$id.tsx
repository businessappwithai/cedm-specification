import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-request-status/$id')({
  component: ServiceRequestStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceRequestStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_request_status" recordId={id} />;
}
