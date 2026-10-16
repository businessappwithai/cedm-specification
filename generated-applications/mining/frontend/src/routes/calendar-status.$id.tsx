import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/calendar-status/$id')({
  component: CalendarStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CalendarStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="calendar_status" recordId={id} />;
}
