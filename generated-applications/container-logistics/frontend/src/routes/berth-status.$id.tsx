import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/berth-status/$id')({
  component: BerthStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function BerthStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="berth_status" recordId={id} />;
}
