import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/work-center/$id')({
  component: WorkCenterDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function WorkCenterDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="work_center" recordId={id} />;
}
