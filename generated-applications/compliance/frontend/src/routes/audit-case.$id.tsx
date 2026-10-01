import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/audit-case/$id')({
  component: AuditCaseDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AuditCaseDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="audit_case" recordId={id} />;
}
