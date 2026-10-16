import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/calendar-exception/$id')({
  component: CalendarExceptionDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CalendarExceptionDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="calendar_exception" recordId={id} />;
}
