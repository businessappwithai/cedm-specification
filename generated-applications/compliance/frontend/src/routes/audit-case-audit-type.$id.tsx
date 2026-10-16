import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/audit-case-audit-type/$id')({
  component: AuditCaseAuditTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AuditCaseAuditTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="audit_case_audit_type" recordId={id} />;
}
