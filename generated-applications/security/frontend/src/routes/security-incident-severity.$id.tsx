import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/security-incident-severity/$id')({
  component: SecurityIncidentSeverityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SecurityIncidentSeverityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="security_incident_severity" recordId={id} />;
}
