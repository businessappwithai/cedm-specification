import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/integration-endpoint/$id')({
  component: IntegrationEndpointDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function IntegrationEndpointDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="integration_endpoint" recordId={id} />;
}
