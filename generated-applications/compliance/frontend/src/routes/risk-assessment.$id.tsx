import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/risk-assessment/$id')({
  component: RiskAssessmentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RiskAssessmentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="risk_assessment" recordId={id} />;
}
