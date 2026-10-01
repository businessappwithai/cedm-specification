import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/media-right/$id')({
  component: MediaRightDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MediaRightDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="media_right" recordId={id} />;
}
