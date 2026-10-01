import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/container-movement-status/$id')({
  component: ContainerMovementStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContainerMovementStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="container_movement_status" recordId={id} />;
}
