import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/timesheet/$id')({
  component: TimesheetDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TimesheetDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="timesheet" recordId={id} />;
}
