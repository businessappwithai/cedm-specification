import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/document-status/$id')({
  component: DocumentStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DocumentStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="document_status" recordId={id} />;
}
