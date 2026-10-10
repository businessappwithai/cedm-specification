import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/appointment-status/$id')({
  component: AppointmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AppointmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="appointment_status" recordId={id} />;
}
