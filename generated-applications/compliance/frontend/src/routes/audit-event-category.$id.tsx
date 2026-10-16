import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/audit-event-category/$id')({
  component: AuditEventCategoryDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AuditEventCategoryDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="audit_event_category" recordId={id} />;
}
