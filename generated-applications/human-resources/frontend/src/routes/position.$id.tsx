import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/position/$id')({
  component: PositionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function PositionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="position" recordId={id} />;
}
