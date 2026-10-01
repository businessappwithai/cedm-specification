import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/serial-number-status/$id')({
  component: SerialNumberStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function SerialNumberStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="serial_number_status" recordId={id} />;
}
