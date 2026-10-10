import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/leave-request-status/$id')({
  component: LeaveRequestStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LeaveRequestStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="leave_request_status" recordId={id} />;
}
