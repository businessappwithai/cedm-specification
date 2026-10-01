import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/nonconformance-status/$id')({
  component: NonconformanceStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function NonconformanceStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="nonconformance_status" recordId={id} />;
}
