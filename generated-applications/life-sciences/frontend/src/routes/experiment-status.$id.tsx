import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/experiment-status/$id')({
  component: ExperimentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ExperimentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="experiment_status" recordId={id} />;
}
