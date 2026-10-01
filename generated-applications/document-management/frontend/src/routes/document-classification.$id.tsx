import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/document-classification/$id')({
  component: DocumentClassificationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DocumentClassificationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="document_classification" recordId={id} />;
}
