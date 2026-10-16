import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compliance-requirement-source-type/$id')({
  component: ComplianceRequirementSourceTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ComplianceRequirementSourceTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compliance_requirement_source_type" recordId={id} />;
}
