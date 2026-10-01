import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/aievaluation/$id')({
  component: AIEvaluationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AIEvaluationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ai_evaluation" recordId={id} />;
}
