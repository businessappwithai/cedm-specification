import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/serial-number/$id')({
  component: SerialNumberDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SerialNumberDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="serial_number" recordId={id} />;
}
