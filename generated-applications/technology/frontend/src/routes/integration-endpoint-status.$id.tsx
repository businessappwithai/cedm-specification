import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/integration-endpoint-status/$id')({
  component: IntegrationEndpointStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function IntegrationEndpointStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="integration_endpoint_status" recordId={id} />;
}
