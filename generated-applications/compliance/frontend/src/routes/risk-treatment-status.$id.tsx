import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/risk-treatment-status/$id')({
  component: RiskTreatmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function RiskTreatmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="risk_treatment_status" recordId={id} />;
}
