import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/packing-status/$id')({
  component: PackingStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PackingStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="packing_status" recordId={id} />;
}
