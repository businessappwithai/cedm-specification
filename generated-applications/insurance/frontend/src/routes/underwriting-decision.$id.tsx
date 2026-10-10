import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/underwriting-decision/$id')({
  component: UnderwritingDecisionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function UnderwritingDecisionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="underwriting_decision" recordId={id} />;
}
