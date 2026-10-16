import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compliance-requirement-risk-rating/$id')({
  component: ComplianceRequirementRiskRatingDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ComplianceRequirementRiskRatingDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compliance_requirement_risk_rating" recordId={id} />;
}
