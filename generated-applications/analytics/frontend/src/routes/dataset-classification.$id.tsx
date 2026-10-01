import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/dataset-classification/$id')({
  component: DatasetClassificationDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DatasetClassificationDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="dataset_classification" recordId={id} />;
}
