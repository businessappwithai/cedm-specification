import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/integration-endpoint-authentication-method/$id')({
  component: IntegrationEndpointAuthenticationMethodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function IntegrationEndpointAuthenticationMethodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="integration_endpoint_authentication_method" recordId={id} />;
}
