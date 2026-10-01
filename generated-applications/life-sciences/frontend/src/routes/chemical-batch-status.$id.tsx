import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/chemical-batch-status/$id')({
  component: ChemicalBatchStatusDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ChemicalBatchStatusDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="chemical_batch_status" recordId={id} />;
}
