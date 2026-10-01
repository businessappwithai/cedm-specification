import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/chemical-batch/$id')({
  component: ChemicalBatchDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function ChemicalBatchDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="chemical_batch" recordId={id} />;
}
