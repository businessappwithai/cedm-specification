import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/timesheet-status/$id')({
  component: TimesheetStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function TimesheetStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="timesheet_status" recordId={id} />;
}
