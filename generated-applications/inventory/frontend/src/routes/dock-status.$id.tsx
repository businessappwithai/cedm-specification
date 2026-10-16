import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/dock-status/$id')({
  component: DockStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DockStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="dock_status" recordId={id} />;
}
