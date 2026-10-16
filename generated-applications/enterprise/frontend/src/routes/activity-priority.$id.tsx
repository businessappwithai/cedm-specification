import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/activity-priority/$id')({
  component: ActivityPriorityDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ActivityPriorityDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="activity_priority" recordId={id} />;
}
