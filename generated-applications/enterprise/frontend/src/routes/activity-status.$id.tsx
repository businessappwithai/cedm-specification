import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/activity-status/$id')({
  component: ActivityStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ActivityStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="activity_status" recordId={id} />;
}
