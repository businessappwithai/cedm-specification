import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compliance-requirement-status/$id')({
  component: ComplianceRequirementStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ComplianceRequirementStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compliance_requirement_status" recordId={id} />;
}
