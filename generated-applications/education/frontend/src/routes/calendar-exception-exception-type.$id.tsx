import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/calendar-exception-exception-type/$id')({
  component: CalendarExceptionExceptionTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CalendarExceptionExceptionTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="calendar_exception_exception_type" recordId={id} />;
}
