import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/leave-request/$id')({
  component: LeaveRequestDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function LeaveRequestDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="leave_request" recordId={id} />;
}
