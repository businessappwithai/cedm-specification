import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/picking-status/$id')({
  component: PickingStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PickingStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="picking_status" recordId={id} />;
}
