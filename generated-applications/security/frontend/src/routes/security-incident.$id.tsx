import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/security-incident/$id')({
  component: SecurityIncidentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SecurityIncidentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="security_incident" recordId={id} />;
}
