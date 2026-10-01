import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/dataset-status/$id')({
  component: DatasetStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function DatasetStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="dataset_status" recordId={id} />;
}
