import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/position-status/$id')({
  component: PositionStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PositionStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="position_status" recordId={id} />;
}
