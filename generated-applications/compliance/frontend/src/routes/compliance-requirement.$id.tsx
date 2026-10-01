import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compliance-requirement/$id')({
  component: ComplianceRequirementDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ComplianceRequirementDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compliance_requirement" recordId={id} />;
}
