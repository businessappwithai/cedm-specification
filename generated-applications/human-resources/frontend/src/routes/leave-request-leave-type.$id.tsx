import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/leave-request-leave-type/$id')({
  component: LeaveRequestLeaveTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LeaveRequestLeaveTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="leave_request_leave_type" recordId={id} />;
}
