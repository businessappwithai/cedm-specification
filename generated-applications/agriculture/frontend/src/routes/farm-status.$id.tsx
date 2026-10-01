import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/farm-status/$id')({
  component: FarmStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FarmStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="farm_status" recordId={id} />;
}
