import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/class/$id')({
  component: ClassDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ClassDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="class" recordId={id} />;
}
