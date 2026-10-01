import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/media-right-status/$id')({
  component: MediaRightStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MediaRightStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="media_right_status" recordId={id} />;
}
