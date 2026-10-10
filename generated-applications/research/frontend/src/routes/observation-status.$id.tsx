import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/observation-status/$id')({
  component: ObservationStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ObservationStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="observation_status" recordId={id} />;
}
