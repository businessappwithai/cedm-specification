import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/service-request/$id')({
  component: ServiceRequestDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ServiceRequestDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="service_request" recordId={id} />;
}
