import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-bay/$id')({
  component: YardBayDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardBayDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_bay" recordId={id} />;
}
