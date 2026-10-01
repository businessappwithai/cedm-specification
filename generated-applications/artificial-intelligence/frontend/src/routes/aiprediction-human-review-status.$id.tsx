import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/aiprediction-human-review-status/$id')({
  component: AIPredictionHumanReviewStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AIPredictionHumanReviewStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ai_prediction_human_review_status" recordId={id} />;
}
