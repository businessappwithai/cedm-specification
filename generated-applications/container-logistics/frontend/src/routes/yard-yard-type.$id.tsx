import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/yard-yard-type/$id')({
  component: YardYardTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function YardYardTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="yard_yard_type" recordId={id} />;
}
