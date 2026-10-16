import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/risk-treatment-target-rating/$id')({
  component: RiskTreatmentTargetRatingDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RiskTreatmentTargetRatingDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="risk_treatment_target_rating" recordId={id} />;
}
