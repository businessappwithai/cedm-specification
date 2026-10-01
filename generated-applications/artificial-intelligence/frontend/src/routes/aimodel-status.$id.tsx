import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/aimodel-status/$id')({
  component: AIModelStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AIModelStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="ai_model_status" recordId={id} />;
}
