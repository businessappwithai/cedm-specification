import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/security-incident-status/$id')({
  component: SecurityIncidentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SecurityIncidentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="security_incident_status" recordId={id} />;
}
