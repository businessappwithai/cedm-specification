import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/result-status/$id')({
  component: ResultStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ResultStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="result_status" recordId={id} />;
}
