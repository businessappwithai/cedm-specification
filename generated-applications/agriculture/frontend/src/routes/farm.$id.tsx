import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/farm/$id')({
  component: FarmDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function FarmDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="farm" recordId={id} />;
}
