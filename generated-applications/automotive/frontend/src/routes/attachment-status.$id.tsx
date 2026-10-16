import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/attachment-status/$id')({
  component: AttachmentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function AttachmentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="attachment_status" recordId={id} />;
}
