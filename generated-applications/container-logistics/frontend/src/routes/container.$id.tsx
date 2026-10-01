import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/container/$id')({
  component: ContainerDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContainerDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="container" recordId={id} />;
}
