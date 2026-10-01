import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/audit-event/$id')({
  component: AuditEventDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AuditEventDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="audit_event" recordId={id} />;
}
