import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/activity-activity-type/$id')({
  component: ActivityActivityTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ActivityActivityTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="activity_activity_type" recordId={id} />;
}
