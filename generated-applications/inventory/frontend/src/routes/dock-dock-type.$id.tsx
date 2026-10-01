import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/dock-dock-type/$id')({
  component: DockDockTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DockDockTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="dock_dock_type" recordId={id} />;
}
