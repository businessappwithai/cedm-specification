import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/risk-assessment-inherent-likelihood/$id')({
  component: RiskAssessmentInherentLikelihoodDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RiskAssessmentInherentLikelihoodDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="risk_assessment_inherent_likelihood" recordId={id} />;
}
