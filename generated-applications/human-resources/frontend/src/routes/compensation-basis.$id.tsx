import { createFileRoute } from '@tanstack/react-router';
import { BusEntityDetailPage } from '@/components/admin/bus-entity-detail-page';

export const Route = createFileRoute('/compensation-basis/$id')({
  component: CompensationBasisDetailPage,
});

// Generated thin wrapper — replace the component body below to build a fully
// custom detail window for this entity without touching the shared infrastructure.
function CompensationBasisDetailPage() {
  const { id } = Route.useParams();
  return <BusEntityDetailPage entityName="compensation_basis" recordId={id} />;
}
