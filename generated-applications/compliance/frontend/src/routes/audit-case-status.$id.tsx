import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/audit-case-status/$id')({
  component: AuditCaseStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AuditCaseStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="audit_case_status" recordId={id} />;
}
