import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/process-instance/$id')({
  component: ProcessInstanceDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ProcessInstanceDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="process_instance" recordId={id} />;
}
