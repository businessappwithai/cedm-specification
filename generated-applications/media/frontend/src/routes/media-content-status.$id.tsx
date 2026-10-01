import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/media-content-status/$id')({
  component: MediaContentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MediaContentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="media_content_status" recordId={id} />;
}
