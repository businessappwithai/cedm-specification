import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/media-content-content-type/$id')({
  component: MediaContentContentTypeDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function MediaContentContentTypeDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="media_content_content_type" recordId={id} />;
}
