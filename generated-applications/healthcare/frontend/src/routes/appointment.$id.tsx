import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/appointment/$id')({
  component: AppointmentDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AppointmentDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="appointment" recordId={id} />;
}
