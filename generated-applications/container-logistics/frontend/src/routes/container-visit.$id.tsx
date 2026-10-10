import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/container-visit/$id')({
  component: ContainerVisitDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ContainerVisitDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="container_visit" recordId={id} />;
}
