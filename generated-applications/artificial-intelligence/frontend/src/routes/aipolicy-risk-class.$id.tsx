import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/aipolicy-risk-class/$id')({
  component: AIPolicyRiskClassDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AIPolicyRiskClassDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ai_policy_risk_class" recordId={id} />;
}
